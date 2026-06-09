import { Router } from "express";
import { db, themeSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateThemeSettingsBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

async function ensureSettings() {
  const existing = await db.select().from(themeSettingsTable).limit(1);
  if (existing.length === 0) {
    const [row] = await db.insert(themeSettingsTable).values({}).returning();
    return row;
  }
  return existing[0];
}

router.get("/settings/theme", requireAuth, async (req, res) => {
  const settings = await ensureSettings();
  return res.json(settings);
});

router.patch("/settings/theme", requireAuth, async (req, res) => {
  const parsed = UpdateThemeSettingsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });

  const settings = await ensureSettings();
  const [updated] = await db
    .update(themeSettingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(themeSettingsTable.id, settings.id))
    .returning();

  return res.json(updated);
});

export default router;
