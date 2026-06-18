import { Router, type Request, type Response } from "express";
import { db, announcementsTable, usersTable } from "@workspace/db";
import { eq, and, or, isNull, gte } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/* ─── GET /announcements ─────────────────────────────────── */
router.get("/announcements", requireAuth, async (req: Request, res: Response) => {
  const now = new Date();
  const rows = await db
    .select({
      id:          announcementsTable.id,
      title:       announcementsTable.title,
      content:     announcementsTable.content,
      type:        announcementsTable.type,
      eventDate:   announcementsTable.eventDate,
      isActive:    announcementsTable.isActive,
      createdBy:   announcementsTable.createdBy,
      createdByName: usersTable.name,
      createdAt:   announcementsTable.createdAt,
      expiresAt:   announcementsTable.expiresAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.createdBy, usersTable.id))
    .where(
      and(
        eq(announcementsTable.isActive, true),
        or(isNull(announcementsTable.expiresAt), gte(announcementsTable.expiresAt, now))
      )
    )
    .orderBy(announcementsTable.createdAt);

  return res.json(rows.map(r => ({
    ...r,
    eventDate: r.eventDate ? r.eventDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
  })));
});

/* ─── GET /announcements/all  (admin/manager — includes inactive) ── */
router.get("/announcements/all", requireAuth, async (req: Request, res: Response) => {
  const role = (req as any).authUserRole;
  if (role !== "admin" && role !== "sector_manager") {
    return res.status(403).json({ error: "Sem permissão" });
  }

  const rows = await db
    .select({
      id:          announcementsTable.id,
      title:       announcementsTable.title,
      content:     announcementsTable.content,
      type:        announcementsTable.type,
      eventDate:   announcementsTable.eventDate,
      isActive:    announcementsTable.isActive,
      createdBy:   announcementsTable.createdBy,
      createdByName: usersTable.name,
      createdAt:   announcementsTable.createdAt,
      expiresAt:   announcementsTable.expiresAt,
    })
    .from(announcementsTable)
    .leftJoin(usersTable, eq(announcementsTable.createdBy, usersTable.id))
    .orderBy(announcementsTable.createdAt);

  return res.json(rows.map(r => ({
    ...r,
    eventDate: r.eventDate ? r.eventDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
  })));
});

/* ─── POST /announcements ────────────────────────────────── */
router.post("/announcements", requireAuth, async (req: Request, res: Response) => {
  const role = (req as any).authUserRole;
  if (role !== "admin" && role !== "sector_manager") {
    return res.status(403).json({ error: "Sem permissão para criar avisos" });
  }

  const { title, content, type, eventDate, expiresAt } = req.body;

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({ error: "Título inválido (mín. 3 caracteres)" });
  }
  if (!content || typeof content !== "string" || content.trim().length < 5) {
    return res.status(400).json({ error: "Conteúdo inválido (mín. 5 caracteres)" });
  }
  const ALLOWED_TYPES = ["info", "event", "alert"];
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: "Tipo inválido" });
  }

  const userId = (req as any).authUserId;

  const [ann] = await db.insert(announcementsTable).values({
    title:     title.trim(),
    content:   content.trim(),
    type,
    eventDate: eventDate ? new Date(eventDate) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    createdBy: userId,
    isActive:  true,
  }).returning();

  return res.status(201).json({
    ...ann,
    eventDate: ann.eventDate ? ann.eventDate.toISOString() : null,
    createdAt: ann.createdAt.toISOString(),
    expiresAt: ann.expiresAt ? ann.expiresAt.toISOString() : null,
  });
});

/* ─── PATCH /announcements/:id ───────────────────────────── */
router.patch("/announcements/:id", requireAuth, async (req: Request, res: Response) => {
  const role = (req as any).authUserRole;
  if (role !== "admin" && role !== "sector_manager") {
    return res.status(403).json({ error: "Sem permissão" });
  }

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const { title, content, type, eventDate, expiresAt, isActive } = req.body;
  const updates: Record<string, unknown> = {};

  if (title !== undefined) updates.title = String(title).trim();
  if (content !== undefined) updates.content = String(content).trim();
  if (type !== undefined && ["info","event","alert"].includes(type)) updates.type = type;
  if (eventDate !== undefined) updates.eventDate = eventDate ? new Date(eventDate) : null;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (typeof isActive === "boolean") updates.isActive = isActive;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  const [ann] = await db
    .update(announcementsTable)
    .set(updates)
    .where(eq(announcementsTable.id, id))
    .returning();

  if (!ann) return res.status(404).json({ error: "Aviso não encontrado" });

  return res.json({
    ...ann,
    eventDate: ann.eventDate ? ann.eventDate.toISOString() : null,
    createdAt: ann.createdAt.toISOString(),
    expiresAt: ann.expiresAt ? ann.expiresAt.toISOString() : null,
  });
});

/* ─── DELETE /announcements/:id ──────────────────────────── */
router.delete("/announcements/:id", requireAuth, async (req: Request, res: Response) => {
  const role = (req as any).authUserRole;
  if (role !== "admin" && role !== "sector_manager") {
    return res.status(403).json({ error: "Sem permissão" });
  }

  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  return res.json({ success: true });
});

export default router;
