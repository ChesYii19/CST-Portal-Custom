import { Router } from "express";
import { db, channelsTable, messagesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateMessageBody, GetMessagesQueryParams } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) return res.status(401).json({ error: "Não autenticado" });
  next();
}

const ROLES: Record<string, string> = {
  admin: "Administrador",
  sector_manager: "Gestor de Setor",
  employee: "Colaborador",
};

router.get("/channels", requireAuth, async (req, res) => {
  const channels = await db.select().from(channelsTable).orderBy(channelsTable.id);
  // Get message counts
  const result = await Promise.all(
    channels.map(async (ch) => {
      const msgs = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.channelId, ch.id));
      return {
        id: ch.id,
        name: ch.name,
        isPublic: ch.isPublic,
        messageCount: msgs.length,
      };
    })
  );
  return res.json(result);
});

router.get("/messages", requireAuth, async (req, res) => {
  const parsed = GetMessagesQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "channelId é obrigatório" });

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.channelId, parsed.data.channelId))
    .orderBy(messagesTable.createdAt);

  return res.json(
    messages.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      userId: m.userId,
      userName: m.userName,
      userRole: m.userRole,
      userInitials: m.userInitials,
      userColor: m.userColor,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/messages", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

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

  return res.status(201).json({
    id: msg.id,
    channelId: msg.channelId,
    userId: msg.userId,
    userName: msg.userName,
    userRole: msg.userRole,
    userInitials: msg.userInitials,
    userColor: msg.userColor,
    text: msg.text,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
