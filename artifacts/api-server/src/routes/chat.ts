import { Router, type Request, type Response } from "express";
import { db, channelsTable, messagesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateMessageBody, GetMessagesQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const ROLES: Record<string, string> = {
  admin: "Administrador",
  sector_manager: "Gestor de Setor",
  employee: "Colaborador",
};

router.get("/channels", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const channels = await db.select().from(channelsTable).orderBy(channelsTable.id);
  const result = await Promise.all(
    channels.map(async (ch) => {
      const msgs = await db.select().from(messagesTable).where(eq(messagesTable.channelId, ch.id));
      return { id: ch.id, name: ch.name, isPublic: ch.isPublic, messageCount: msgs.length };
    })
  );
  res.json(result);
});

router.get("/messages", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = GetMessagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "channelId é obrigatório" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.channelId, parsed.data.channelId))
    .orderBy(messagesTable.createdAt);

  res.json(
    messages.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      userId: m.userId,
      userName: m.userName,
      userRole: m.userRole,
      userInitials: m.userInitials,
      userColor: m.userColor,
      text: m.text,
      edited: m.edited ?? false,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/messages", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  // Enforce message length limits
  if (!parsed.data.text.trim()) {
    res.status(400).json({ error: "Mensagem não pode ser vazia" });
    return;
  }
  if (parsed.data.text.length > 2000) {
    res.status(400).json({ error: "Mensagem muito longa (máx. 2000 caracteres)" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      channelId: parsed.data.channelId,
      userId,
      userName: user.name,
      userRole: ROLES[user.role] || user.role,
      userInitials: user.initials,
      userColor: user.color,
      text: parsed.data.text,
    })
    .returning();

  res.status(201).json({
    id: msg.id,
    channelId: msg.channelId,
    userId: msg.userId,
    userName: msg.userName,
    userRole: msg.userRole,
    userInitials: msg.userInitials,
    userColor: msg.userColor,
    text: msg.text,
    edited: false,
    createdAt: msg.createdAt.toISOString(),
  });
});

router.put("/messages/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const { text } = req.body;
  if (!text?.trim()) { res.status(400).json({ error: "Texto não pode ser vazio" }); return; }

  const [existing] = await db.select().from(messagesTable).where(eq(messagesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Mensagem não encontrada" }); return; }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (existing.userId !== userId && me?.role !== 'admin') {
    res.status(403).json({ error: "Sem permissão" }); return;
  }

  const [updated] = await db
    .update(messagesTable)
    .set({ text: text.trim(), edited: true })
    .where(eq(messagesTable.id, id))
    .returning();

  res.json({
    id: updated.id,
    channelId: updated.channelId,
    userId: updated.userId,
    userName: updated.userName,
    userRole: updated.userRole,
    userInitials: updated.userInitials,
    userColor: updated.userColor,
    text: updated.text,
    edited: updated.edited ?? true,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/messages/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).authUserId;
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [existing] = await db.select().from(messagesTable).where(eq(messagesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Mensagem não encontrada" }); return; }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (existing.userId !== userId && me?.role !== 'admin') {
    res.status(403).json({ error: "Sem permissão" }); return;
  }

  await db.delete(messagesTable).where(eq(messagesTable.id, id));
  res.json({ success: true });
});

export default router;
