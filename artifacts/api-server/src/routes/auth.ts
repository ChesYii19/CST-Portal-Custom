import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateSecret, generateURI, verify as totpVerify } from "otplib";
import QRCode from "qrcode";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { authLimiter } from "../lib/rateLimiters";

const router = Router();

// Per-account lockout settings
const LOCK_THRESHOLD   = 3;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Dummy hash used to equalize response time when the user doesn't exist.
const DUMMY_HASH = bcrypt.hashSync("__cst_timing_sentinel__", 10);

/** Shared helper: return safe user payload */
function userPayload(u: typeof usersTable.$inferSelect) {
  return {
    id:       u.id,
    name:     u.name,
    email:    u.email,
    role:     u.role,
    dept:     u.dept,
    initials: u.initials,
    color:    u.color,
    status:   u.status,
    twoFactorEnabled: u.twoFactorEnabled,
  };
}

/** Password complexity validation */
function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8)     return "Senha deve ter pelo menos 8 caracteres";
  if (!/[A-Z]/.test(password)) return "Senha deve conter pelo menos uma letra maiúscula";
  if (!/[a-z]/.test(password)) return "Senha deve conter pelo menos uma letra minúscula";
  if (!/[0-9]/.test(password)) return "Senha deve conter pelo menos um número";
  if (password.length > 128)   return "Senha deve ter no máximo 128 caracteres";
  return null;
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
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
    await db.update(usersTable).set({ loginAttempts: 0, lockedAt: null }).where(eq(usersTable.id, user.id));
  }

  if (user.status === "inativo") {
    await bcrypt.compare(password, DUMMY_HASH);
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

  // ── 2FA check ──────────────────────────────────────────────────────────────
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    // Don't create full session yet — store pending state until code is verified
    (req.session as any).pendingUserId = user.id;
    req.session.save((err) => {
      if (err) { res.status(500).json({ error: "Erro de sessão" }); return; }
      res.json({ requires2fa: true });
    });
    return;
  }

  // ── Temporary password check ───────────────────────────────────────────────
  (req.session as any).userId = user.id;
  if (user.isTemporaryPassword) {
    (req.session as any).requiresPasswordChange = true;
  }

  req.session.save((saveErr) => {
    if (saveErr) { res.status(500).json({ error: "Erro ao criar sessão" }); return; }
    const payload: any = userPayload(user);
    if (user.isTemporaryPassword) payload.requiresPasswordChange = true;
    res.json(payload);
  });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.clearCookie("cst.sid", { path: "/", httpOnly: true, secure: true, sameSite: "none" });
    res.json({ success: true });
  });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Usuário não encontrado" }); return; }
  const payload: any = userPayload(user);
  if ((req.session as any).requiresPasswordChange) payload.requiresPasswordChange = true;
  res.json(payload);
});

// ─── PATCH /auth/me ───────────────────────────────────────────────────────────
router.patch("/auth/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;

  const ALLOWED_DEPTS  = ["Administração","RH","Financeiro","Projetos","TI","Jurídico","Marketing","Geral"];
  const ALLOWED_COLORS = ["#2E5665","#FC9BB3","#FEDC05","#00C1D4","#A58877","#486F5C","#E3DC97","#88CAE3"];

  const { name, dept, color } = req.body;
  const updates: Record<string, string> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({ error: "Nome inválido (2–100 caracteres)" }); return;
    }
    updates.name = name.trim();
    updates.initials = name.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  if (dept !== undefined) {
    if (!ALLOWED_DEPTS.includes(dept)) { res.status(400).json({ error: "Departamento inválido" }); return; }
    updates.dept = dept;
  }

  if (color !== undefined) {
    if (!ALLOWED_COLORS.includes(color)) { res.status(400).json({ error: "Cor inválida" }); return; }
    updates.color = color;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nenhum campo válido para atualizar" }); return;
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  res.json(userPayload(updated));
});

// ─── POST /auth/change-password ───────────────────────────────────────────────
// Allows any authenticated user to change their password.
// For temporary-password accounts: requires the old (temp) password + new password.
router.post("/auth/change-password", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== "string") {
    res.status(400).json({ error: "Senha atual é obrigatória" }); return;
  }
  if (!newPassword || typeof newPassword !== "string") {
    res.status(400).json({ error: "Nova senha é obrigatória" }); return;
  }

  const pwError = validatePasswordComplexity(newPassword);
  if (pwError) { res.status(400).json({ error: pwError }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Usuário não encontrado" }); return; }

  const validCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validCurrent) { res.status(401).json({ error: "Senha atual incorreta" }); return; }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: "A nova senha deve ser diferente da atual" }); return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable)
    .set({ passwordHash, isTemporaryPassword: false })
    .where(eq(usersTable.id, userId));

  // Clear requiresPasswordChange from session
  delete (req.session as any).requiresPasswordChange;
  req.session.save(() => {
    res.json({ success: true });
  });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
// Allows password reset using a token generated by admin. No session required.
router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    res.status(400).json({ error: "Dados incompletos" }); return;
  }

  const pwError = validatePasswordComplexity(newPassword);
  if (pwError) { res.status(400).json({ error: pwError }); return; }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, String(email).toLowerCase()))
    .limit(1);

  // Use same timing to avoid user enumeration
  if (!user || user.passwordResetToken !== token) {
    res.status(400).json({ error: "Token inválido ou expirado" }); return;
  }

  if (!user.passwordResetTokenExpiresAt || new Date(user.passwordResetTokenExpiresAt) < new Date()) {
    res.status(400).json({ error: "Token expirado. Solicite um novo ao administrador." }); return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable)
    .set({
      passwordHash,
      isTemporaryPassword:          false,
      passwordResetToken:           null,
      passwordResetTokenExpiresAt:  null,
    })
    .where(eq(usersTable.id, user.id));

  res.json({ success: true });
});

// ─── POST /auth/2fa/setup ─────────────────────────────────────────────────────
// Generates a new 2FA secret + QR code URL for the current user.
// Does NOT enable 2FA — user must call /auth/2fa/enable with a valid code first.
router.post("/auth/2fa/setup", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Usuário não encontrado" }); return; }

  const secret   = generateSecret();
  const otpauth  = generateURI({ label: user.email, issuer: "CST Portal", secret });
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  // Store secret (not enabled yet — user must confirm via /2fa/enable)
  await db.update(usersTable).set({ twoFactorSecret: secret }).where(eq(usersTable.id, userId));

  res.json({ secret, qrCodeUrl });
});

// ─── POST /auth/2fa/enable ────────────────────────────────────────────────────
// Verifies the TOTP code and activates 2FA for the current user.
router.post("/auth/2fa/enable", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Código é obrigatório" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || !user.twoFactorSecret) {
    res.status(400).json({ error: "Configure o 2FA antes de ativar. Chame /auth/2fa/setup primeiro." }); return;
  }

  if (user.twoFactorEnabled) {
    res.status(400).json({ error: "2FA já está ativado" }); return;
  }

  const isValid = totpVerify({ secret: user.twoFactorSecret, token: code.trim() });
  if (!isValid) {
    res.status(401).json({ error: "Código inválido. Verifique seu aplicativo autenticador." }); return;
  }

  await db.update(usersTable).set({ twoFactorEnabled: true }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// ─── POST /auth/2fa/verify ────────────────────────────────────────────────────
// Verifies TOTP code during login (pendingUserId must be set in session).
router.post("/auth/2fa/verify", async (req: Request, res: Response): Promise<void> => {
  const pendingUserId = (req.session as any).pendingUserId;
  if (!pendingUserId) {
    res.status(400).json({ error: "Nenhuma autenticação pendente. Faça login primeiro." }); return;
  }

  const { code } = req.body;
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Código é obrigatório" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, pendingUserId)).limit(1);
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(400).json({ error: "Configuração de 2FA inválida" }); return;
  }

  const isValid = totpVerify({ secret: user.twoFactorSecret, token: code.trim() });
  if (!isValid) {
    res.status(401).json({ error: "Código inválido. Tente novamente." }); return;
  }

  // 2FA verified — promote pending to full session
  delete (req.session as any).pendingUserId;
  (req.session as any).userId = user.id;
  if (user.isTemporaryPassword) {
    (req.session as any).requiresPasswordChange = true;
  }

  req.session.save((err) => {
    if (err) { res.status(500).json({ error: "Erro de sessão" }); return; }
    const payload: any = userPayload(user);
    if (user.isTemporaryPassword) payload.requiresPasswordChange = true;
    res.json(payload);
  });
});

// ─── POST /auth/2fa/disable ───────────────────────────────────────────────────
// Disables 2FA after verifying the current TOTP code.
router.post("/auth/2fa/disable", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Código é obrigatório para desativar o 2FA" }); return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(400).json({ error: "2FA não está ativado" }); return;
  }

  const isValid = totpVerify({ secret: user.twoFactorSecret, token: code.trim() });
  if (!isValid) {
    res.status(401).json({ error: "Código inválido" }); return;
  }

  await db.update(usersTable)
    .set({ twoFactorEnabled: false, twoFactorSecret: null })
    .where(eq(usersTable.id, userId));

  res.json({ success: true });
});

export default router;
