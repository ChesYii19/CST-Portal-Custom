import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateUserBody,
  UpdateUserBody,
  UpdateUserParams,
  DeleteUserParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/* ─── Helpers ─────────────────────────────────────────────── */

// Reusable admin gate — relies on role cached by requireAuth
function requireAdmin(req: any, res: any, next: any) {
  if ((req as any).authUserRole !== "admin") {
    return res.status(403).json({ error: "Acesso negado — requer perfil de administrador" });
  }
  next();
}

// Load full user record into req.currentUser (needed by admin handlers)
async function loadUser(req: any, res: any, next: any) {
  const userId = (req as any).authUserId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
  (req as any).currentUser = user;
  next();
}

function mapUser(u: any) {
  return {
    id:       u.id,
    name:     u.name,
    email:    u.email,
    role:     u.role,
    dept:     u.dept,
    initials: u.initials,
    color:    u.color,
    status:   u.status,
  };
}

/**
 * Password complexity rules (OWASP baseline):
 *   - Minimum 8 characters
 *   - At least 1 uppercase letter
 *   - At least 1 lowercase letter
 *   - At least 1 digit
 * Returns an error message string, or null if valid.
 */
function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8)       return "Senha deve ter pelo menos 8 caracteres";
  if (!/[A-Z]/.test(password))   return "Senha deve conter pelo menos uma letra maiúscula";
  if (!/[a-z]/.test(password))   return "Senha deve conter pelo menos uma letra minúscula";
  if (!/[0-9]/.test(password))   return "Senha deve conter pelo menos um número";
  if (password.length > 128)     return "Senha deve ter no máximo 128 caracteres";
  return null;
}

/* ─── GET /users ──────────────────────────────────────────── */
// RESTRICTED to admin only — the user list contains emails, roles, and department data.
// Collaborators and managers do NOT need this information.
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  return res.json(users.map(mapUser));
});

/* ─── POST /users ─────────────────────────────────────────── */
router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const { name, email, password, role, dept, color } = parsed.data;

  // Enforce password complexity on creation
  const pwError = validatePasswordComplexity(password);
  if (pwError) return res.status(400).json({ error: pwError });

  // Check for duplicate email
  const [existing] = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  if (existing) return res.status(409).json({ error: "Este e-mail já está cadastrado" });

  const passwordHash = await bcrypt.hash(password, 12); // 12 rounds (OWASP recommended)
  const initials = name.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const [user] = await db.insert(usersTable).values({
    name:         name.trim(),
    email:        email.toLowerCase(),
    passwordHash,
    role,
    dept,
    initials,
    color:        color || "#2E5665",
    status:       "ativo",
    loginAttempts: 0,
  }).returning();

  return res.status(201).json(mapUser(user));
});

/* ─── PATCH /users/:id ─────────────────────────────────────── */
// Admin-only: can change role, status, dept, name, and optionally reset password.
router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const paramsParsed = UpdateUserParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "ID inválido" });

  const bodyParsed = UpdateUserBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const updates: any = { ...bodyParsed.data };

  // If password is being reset, enforce complexity and hash it
  if (updates.password) {
    const pwError = validatePasswordComplexity(updates.password);
    if (pwError) return res.status(400).json({ error: pwError });
    updates.passwordHash = await bcrypt.hash(updates.password, 12);
    delete updates.password;
  }

  // Recompute initials if name changed
  if (updates.name) {
    updates.name    = updates.name.trim();
    updates.initials = updates.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(mapUser(updated));
});

/* ─── POST /users/:id/reset-token ────────────────────────── */
// Admin only: generate a password-reset token for a user (shared via internal comms).
router.post("/users/:id/reset-token", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const [user] = await db.select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  // Prevent generating a token for yourself (extra precaution)
  if (id === (req as any).authUserId) {
    return res.status(400).json({ error: "Use 'Alterar senha' para resetar sua própria senha" });
  }

  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.update(usersTable).set({
    passwordResetToken:          token,
    passwordResetTokenExpiresAt: expiresAt,
    isTemporaryPassword:         true,
  }).where(eq(usersTable.id, id));

  return res.json({ token, expiresAt: expiresAt.toISOString() });
});

/* ─── DELETE /users/:id ────────────────────────────────────── */
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const paramsParsed = DeleteUserParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "ID inválido" });

  // Prevent self-deletion — an admin deleting themselves would leave no admin
  if (paramsParsed.data.id === (req as any).authUserId) {
    return res.status(403).json({ error: "Não é possível remover sua própria conta" });
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, paramsParsed.data.id))
    .limit(1);
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado" });

  await db.delete(usersTable).where(eq(usersTable.id, paramsParsed.data.id));
  return res.json({ success: true });
});

export default router;
