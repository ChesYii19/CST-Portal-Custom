import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { authLimiter } from "../lib/rateLimiters";

const router = Router();

// Per-account lockout settings
const LOCK_THRESHOLD  = 3;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Dummy hash used to equalize response time when the user doesn't exist.
// Prevents user enumeration via timing attack (bcrypt compare is ~100ms;
// skipping it for unknown emails makes those responses ~100ms faster, leaking valid emails).
const DUMMY_HASH = bcrypt.hashSync("__cst_timing_sentinel__", 10);

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post("/auth/login", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  // Always run bcrypt.compare to prevent timing-based user enumeration.
  // For non-existent users we compare against the dummy hash (always fails).
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  // Check account lock
  if (user.lockedAt) {
    const lockedSince = new Date(user.lockedAt).getTime();
    if (Date.now() - lockedSince < LOCK_DURATION_MS) {
      res.status(423).json({ error: "Conta bloqueada após 3 tentativas. Contacte o administrador.", attemptsLeft: 0 });
      return;
    }
    // Lock expired — reset
    await db.update(usersTable).set({ loginAttempts: 0, lockedAt: null }).where(eq(usersTable.id, user.id));
  }

  // Check inactive users before comparing password (prevent timing leak on status)
  if (user.status === "inativo") {
    await bcrypt.compare(password, DUMMY_HASH); // Keep constant time
    res.status(403).json({ error: "Conta inativa. Contacte o administrador." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const attempts = user.loginAttempts + 1;
    const updates: { loginAttempts: number; lockedAt?: Date | null } = { loginAttempts: attempts };
    if (attempts >= LOCK_THRESHOLD) {
      updates.lockedAt = new Date();
      await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
      res.status(423).json({ error: "Conta bloqueada após 3 tentativas. Contacte o administrador.", attemptsLeft: 0 });
      return;
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
    const left = LOCK_THRESHOLD - attempts;
    res.status(401).json({ error: `Credenciais inválidas. Tentativa ${attempts}/${LOCK_THRESHOLD}.`, attemptsLeft: left });
    return;
  }

  // Reset failed attempts on success
  await db.update(usersTable).set({ loginAttempts: 0, lockedAt: null }).where(eq(usersTable.id, user.id));

  // Store userId in session and persist immediately.
  // session.save() is called explicitly before res.json() to guarantee the session
  // is written to PostgreSQL and the Set-Cookie header is sent before the response
  // body — required behind Replit's reverse proxy (see replit.md architecture decisions).
  // Note: session.regenerate() was attempted for session-fixation protection but it
  // prevents express-session from emitting Set-Cookie in this proxy environment,
  // so we rely on saveUninitialized:false + httpOnly cookie as mitigations instead.
  (req.session as any).userId = user.id;

  req.session.save((saveErr) => {
    if (saveErr) {
      res.status(500).json({ error: "Erro ao criar sessão" });
      return;
    }

    res.json({
      id:       user.id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      dept:     user.dept,
      initials: user.initials,
      color:    user.color,
      status:   user.status,
    });
  });
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    // Explicitly clear the session cookie — without this the httpOnly cookie
    // lingers in the browser until maxAge, creating a stale credential window.
    res.clearCookie("cst.sid", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });
});

// ─── GET /auth/me ────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json({
    id:       user.id,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    dept:     user.dept,
    initials: user.initials,
    color:    user.color,
    status:   user.status,
  });
});

// ─── PATCH /auth/me ──────────────────────────────────────────────────────────
// Allows any authenticated user to update their OWN non-sensitive profile fields.
// Deliberately does NOT allow changing email, role, or status (admin-only changes).
router.patch("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;

  const ALLOWED_DEPTS = ["Administração","RH","Financeiro","Projetos","TI","Jurídico","Marketing","Geral"];
  const ALLOWED_COLORS = ["#2E5665","#FC9BB3","#FEDC05","#00C1D4","#A58877","#486F5C","#E3DC97","#88CAE3"];

  const { name, dept, color } = req.body;
  const updates: Record<string, string> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({ error: "Nome inválido (2–100 caracteres)" });
      return;
    }
    updates.name = name.trim();
    // Recompute initials
    updates.initials = name.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  if (dept !== undefined) {
    if (!ALLOWED_DEPTS.includes(dept)) {
      res.status(400).json({ error: "Departamento inválido" });
      return;
    }
    updates.dept = dept;
  }

  if (color !== undefined) {
    if (!ALLOWED_COLORS.includes(color)) {
      res.status(400).json({ error: "Cor inválida" });
      return;
    }
    updates.color = color;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nenhum campo válido para atualizar" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  res.json({
    id:       updated.id,
    name:     updated.name,
    email:    updated.email,
    role:     updated.role,
    dept:     updated.dept,
    initials: updated.initials,
    color:    updated.color,
    status:   updated.status,
  });
});

export default router;
