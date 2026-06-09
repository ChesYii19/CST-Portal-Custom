import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const userId = (req as any).authUserId;
  const notifs = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(notificationsTable.createdAt);

  return res.json(
    notifs.map((n) => ({
      id: n.id,
      text: n.text,
      time: n.time,
      read: n.read,
    }))
  );
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const userId = (req as any).authUserId;
  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId));
  return res.json({ success: true });
});

export default router;
