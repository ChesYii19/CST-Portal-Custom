import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateUserBody,
  UpdateUserBody,
  UpdateUserParams,
  DeleteUserParams,
} from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) return res.status(401).json({ error: "Não autenticado" });
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!(req as any).currentUser || (req as any).currentUser.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

async function loadUser(req: any, res: any, next: any) {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: "Não autenticado" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
  (req as any).currentUser = user;
  next();
}

function mapUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    dept: u.dept,
    initials: u.initials,
    color: u.color,
    status: u.status,
  };
}

router.get("/users", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  return res.json(users.map(mapUser));
});

router.post("/users", requireAuth, loadUser, requireAdmin, async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const { name, email, password, role, dept, color } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash, role, dept,
    initials,
    color: color || "#2E5A6A",
    status: "ativo",
    loginAttempts: 0,
  }).returning();

  return res.status(201).json(mapUser(user));
});

router.patch("/users/:id", requireAuth, loadUser, requireAdmin, async (req, res) => {
  const paramsParsed = UpdateUserParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "ID inválido" });

  const bodyParsed = UpdateUserBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const [updated] = await db
    .update(usersTable)
    .set(bodyParsed.data)
    .where(eq(usersTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Usuário não encontrado" });
  return res.json(mapUser(updated));
});

router.delete("/users/:id", requireAuth, loadUser, requireAdmin, async (req, res) => {
  const paramsParsed = DeleteUserParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "ID inválido" });

  await db.delete(usersTable).where(eq(usersTable.id, paramsParsed.data.id));
  return res.json({ success: true });
});

export default router;
