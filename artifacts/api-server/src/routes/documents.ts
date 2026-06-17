import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { DeleteDocumentParams, GetDocumentsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const ALLOWED_DEPTS = ["Administração","RH","Financeiro","Projetos","TI","Jurídico","Marketing","Geral"];
const ALLOWED_EXTS  = ["pdf","docx","doc","xlsx","xls","txt","png","jpg","jpeg","pptx","csv"];

/* ─── GET /documents ─────────────────────────────────────── */
router.get("/documents", requireAuth, async (req, res) => {
  const parsed = GetDocumentsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;

  let docs;
  if (search) {
    // Drizzle uses parameterized queries — not vulnerable to SQL injection
    docs = await db
      .select()
      .from(documentsTable)
      .where(or(ilike(documentsTable.name, `%${search}%`), ilike(documentsTable.dept, `%${search}%`)))
      .orderBy(documentsTable.uploadedAt);
  } else {
    docs = await db.select().from(documentsTable).orderBy(documentsTable.uploadedAt);
  }

  return res.json(
    docs.map((d) => ({
      id:         d.id,
      name:       d.name,
      dept:       d.dept,
      size:       d.size,
      ext:        d.ext,
      uploadedAt: new Date(d.uploadedAt).toLocaleDateString("pt-BR"),
    }))
  );
});

/* ─── POST /documents ────────────────────────────────────── */
router.post("/documents", requireAuth, async (req, res) => {
  const { name, dept, size, ext } = req.body;

  // Explicit validation (this route was missing Zod validation)
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }
  if (name.trim().length > 255) {
    return res.status(400).json({ error: "Nome muito longo (máx. 255 caracteres)" });
  }
  if (!dept || !ALLOWED_DEPTS.includes(dept)) {
    return res.status(400).json({ error: "Departamento inválido" });
  }
  const extNorm = (ext || "pdf").toLowerCase();
  if (!ALLOWED_EXTS.includes(extNorm)) {
    return res.status(400).json({ error: "Extensão de arquivo não permitida" });
  }

  // Sanitize size field — must be in format "X.X MB" or default
  const sizeClean = (typeof size === "string" && /^\d+(\.\d+)? (KB|MB|GB)$/.test(size))
    ? size
    : "1.0 MB";

  const [doc] = await db.insert(documentsTable).values({
    name:       name.trim(),
    dept,
    size:       sizeClean,
    ext:        extNorm,
    uploadedAt: new Date(),
  }).returning();

  return res.status(201).json({
    id:         doc.id,
    name:       doc.name,
    dept:       doc.dept,
    size:       doc.size,
    ext:        doc.ext,
    uploadedAt: new Date(doc.uploadedAt).toLocaleDateString("pt-BR"),
  });
});

/* ─── DELETE /documents/:id ──────────────────────────────── */
router.delete("/documents/:id", requireAuth, async (req, res) => {
  const parsed = DeleteDocumentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "ID inválido" });

  // Only admin or sector_manager can delete documents
  const role = (req as any).authUserRole;
  if (role !== "admin" && role !== "sector_manager") {
    return res.status(403).json({ error: "Sem permissão para excluir documentos" });
  }

  await db.delete(documentsTable).where(eq(documentsTable.id, parsed.data.id));
  return res.json({ success: true });
});

export default router;
