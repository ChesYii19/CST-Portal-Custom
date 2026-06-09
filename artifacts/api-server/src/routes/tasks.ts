import { Router } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) return res.status(401).json({ error: "Não autenticado" });
  next();
}

function mapTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    dept: t.dept,
    priority: t.priority,
    status: t.status,
    assigneeInitials: t.assigneeInitials,
    assigneeColor: t.assigneeColor,
  };
}

router.get("/tasks", requireAuth, async (req, res) => {
  const tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  const grouped = {
    todo: tasks.filter((t) => t.status === "todo").map(mapTask),
    doing: tasks.filter((t) => t.status === "doing").map(mapTask),
    done: tasks.filter((t) => t.status === "done").map(mapTask),
  };
  return res.json(grouped);
});

router.post("/tasks", requireAuth, async (req, res) => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });

  // Lookup assignee color
  let assigneeColor = "#6B7A85";
  if (parsed.data.assigneeInitials) {
    const users = await db.select().from(usersTable);
    const u = users.find((u) => u.initials === parsed.data.assigneeInitials);
    if (u) assigneeColor = u.color;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      title: parsed.data.title,
      dept: parsed.data.dept,
      priority: parsed.data.priority,
      status: parsed.data.status,
      assigneeInitials: parsed.data.assigneeInitials || "?",
      assigneeColor,
    })
    .returning();

  return res.status(201).json(mapTask(task));
});

router.patch("/tasks/:id", requireAuth, async (req, res) => {
  const paramsParsed = UpdateTaskParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "ID inválido" });

  const bodyParsed = UpdateTaskBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const updates: any = { ...bodyParsed.data };

  // Update assignee color if initials changed
  if (updates.assigneeInitials) {
    const users = await db.select().from(usersTable);
    const u = users.find((u) => u.initials === updates.assigneeInitials);
    if (u) updates.assigneeColor = u.color;
  }

  const [updated] = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Tarefa não encontrada" });
  return res.json(mapTask(updated));
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
  const parsed = DeleteTaskParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "ID inválido" });

  await db.delete(tasksTable).where(eq(tasksTable.id, parsed.data.id));
  return res.json({ success: true });
});

export default router;
