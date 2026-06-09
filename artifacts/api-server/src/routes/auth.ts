import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, lt } from "drizzle-orm";
import {
  LoginBody,
  GetMeResponse,
} from "@workspace/api-zod";

const router = Router();

const ROLES: Record<string, string> = {
  admin: "Administrador",
  sector_manager: "Gestor de Setor",
  employee: "Colaborador",
};

const LOCK_THRESHOLD = 3;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas. Tentativa 1/3.", attemptsLeft: 2 });
  }

  // Check if locked
  if (user.lockedAt) {
    const lockedSince = new Date(user.lockedAt).getTime();
    if (Date.now() - lockedSince < LOCK_DURATION_MS) {
      return res.status(423).json({ error: "🔒 Conta bloqueada após 3 tentativas. Contacte o administrador.", attemptsLeft: 0 });
    } else {
      // Unlock after timeout
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
      return res.status(423).json({ error: "🔒 Conta bloqueada após 3 tentativas. Contacte o administrador.", attemptsLeft: 0 });
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));
    const left = LOCK_THRESHOLD - attempts;
    return res.status(401).json({ error: `❌ Credenciais inválidas. Tentativa ${attempts}/3.`, attemptsLeft: left });
  }

  // Reset attempts on success
  await db.update(usersTable).set({ loginAttempts: 0, lockedAt: null }).where(eq(usersTable.id, user.id));

  // Set session and save before responding
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
  };

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao criar sessão" });
    }
    return res.json(payload);
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {});
  return res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado" });
  }
  return res.json({
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
