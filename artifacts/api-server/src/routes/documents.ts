import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { DeleteDocumentParams, GetDocumentsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/documents", requireAuth, async (req, res) => {
  const parsed = GetDocumentsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;

  let docs;
  if (search) {
    docs = await db
      .select()
      .from(documentsTable)
      .where(
        or(
          ilike(documentsTable.name, `%${search}%`),
          ilike(documentsTable.dept, `%${search}%`)
        )
      )
      .orderBy(documentsTable.uploadedAt);
  } else {
    docs = await db.select().from(documentsTable).orderBy(documentsTable.uploadedAt);
  }

  return res.json(
    docs.map((d) => ({
      id: d.id,
      name: d.name,
      dept: d.dept,
      size: d.size,
      ext: d.ext,
      uploadedAt: new Date(d.uploadedAt).toLocaleDateString("pt-BR"),
    }))
  );
});

router.post("/documents", requireAuth, async (req, res) => {
  const { name, dept, size, ext } = req.body;
  if (!name || !dept) return res.status(400).json({ error: "Nome e departamento são obrigatórios" });

  const [doc] = await db.insert(documentsTable).values({
    name,
    dept,
    size: size || "1.0 MB",
    ext: ext || "pdf",
    uploadedAt: new Date(),
  }).returning();

  return res.status(201).json({
    id: doc.id,
    name: doc.name,
    dept: doc.dept,
    size: doc.size,
    ext: doc.ext,
    uploadedAt: new Date(doc.uploadedAt).toLocaleDateString("pt-BR"),
  });
});

router.delete("/documents/:id", requireAuth, async (req, res) => {
  const parsed = DeleteDocumentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "ID inválido" });

  await db.delete(documentsTable).where(eq(documentsTable.id, parsed.data.id));
  return res.json({ success: true });
});

export default router;
