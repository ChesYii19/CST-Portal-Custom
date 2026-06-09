import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const LOCK_THRESHOLD = 3;
const LOCK_DURATION_MS = 30 * 60 * 1000;

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
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

  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas. Tentativa 1/3.", attemptsLeft: 2 });
    return;
  }

  if (user.lockedAt) {
    const lockedSince = new Date(user.lockedAt).getTime();
    if (Date.now() - lockedSince < LOCK_DURATION_MS) {
      res.status(423).json({ error: "🔒 Conta bloqueada após 3 tentativas. Contacte o administrador.", attemptsLeft: 0 });
      return;
    } else {
      await db.update(usersTable).set({ loginAttempts: 0, lockedAt: null }).where(eq(usersTable.id, user.id));
    }
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.loginAttempts + 1;
    const updates: { loginAttempts: number; lockedAt?: Date | null } = { loginAttempts: attempts };
    if (attempts >= LOCK_THRESHOLD) {
      updates.lockedAt = new Date();
      await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
      res.status(423).json({ error: "🔒 Conta bloqueada após 3 tentativas. Contacte o administrador.", attemptsLeft: 0 });
      return;
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
    const left = LOCK_THRESHOLD - attempts;
    res.status(401).json({ error: `❌ Credenciais inválidas. Tentativa ${attempts}/3.`, attemptsLeft: left });
    return;
  }

  await db.update(usersTable).set({ loginAttempts: 0, lockedAt: null }).where(eq(usersTable.id, user.id));

  (req.session as any).userId = user.id;

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    dept: user.dept,
    initials: user.initials,
    color: user.color,
    status: user.status,
    sessionToken: req.sessionID,
  };

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Erro ao criar sessão" });
      return;
    }
    res.json(payload);
  });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    dept: user.dept,
    initials: user.initials,
    color: user.color,
    status: user.status,
  });
});

export default router;
