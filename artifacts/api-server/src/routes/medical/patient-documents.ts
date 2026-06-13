import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, patientDocumentsTable, patientsTable } from "@workspace/db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";

const router: IRouter = Router();

const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const patientDocsDir = path.join(uploadRoot, "patient-documents");
if (!fs.existsSync(patientDocsDir)) fs.mkdirSync(patientDocsDir, { recursive: true });

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]);

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 80 ? base.slice(-80) : base;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, patientDocsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${sanitizeFilename(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      cb(new Error("Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX."));
      return;
    }
    cb(null, true);
  },
});

const NotesInput = z.object({ notes: z.string().nullable().optional() });

router.get("/patients/:patientId/documents", async (req, res): Promise<void> => {
  const patientId = parseInt(String(req.params.patientId), 10);
  if (!Number.isFinite(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
  const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  const rows = await db
    .select()
    .from(patientDocumentsTable)
    .where(eq(patientDocumentsTable.patientId, patientId))
    .orderBy(desc(patientDocumentsTable.createdAt));
  res.json(rows);
});

router.post(
  "/patients/:patientId/documents",
  upload.single("document"),
  async (req, res): Promise<void> => {
    const patientId = parseInt(String(req.params.patientId), 10);
    if (!Number.isFinite(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
    if (!req.file) { res.status(400).json({ error: "document_required" }); return; }

    const [patient] = await db.select({ id: patientsTable.id }).from(patientsTable).where(eq(patientsTable.id, patientId));
    if (!patient) {
      fs.unlink(req.file.path, () => {});
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() || null : null;
    const filePath = `/uploads/patient-documents/${req.file.filename}`;
    const userId = (req as any).user?.id as number | undefined;

    const [row] = await db.insert(patientDocumentsTable).values({
      patientId,
      fileName: req.file.originalname,
      filePath,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      notes,
      uploadedBy: userId ?? null,
    }).returning();

    res.status(201).json(row);
  },
);

router.patch("/patients/:patientId/documents/:id", async (req, res): Promise<void> => {
  const patientId = parseInt(String(req.params.patientId), 10);
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(patientId) || !Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = NotesInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db
    .update(patientDocumentsTable)
    .set({ notes: parsed.data.notes ?? null })
    .where(eq(patientDocumentsTable.id, id))
    .returning();
  if (!row || row.patientId !== patientId) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/patients/:patientId/documents/:id", async (req, res): Promise<void> => {
  const patientId = parseInt(String(req.params.patientId), 10);
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(patientId) || !Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(patientDocumentsTable).where(eq(patientDocumentsTable.id, id)).returning();
  if (!row || row.patientId !== patientId) { res.status(404).json({ error: "Not found" }); return; }
  const diskPath = path.join(uploadRoot, row.filePath.replace(/^\/uploads\//, ""));
  fs.unlink(diskPath, () => {});
  res.sendStatus(204);
});

export default router;
