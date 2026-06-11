import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { desc, eq } from "drizzle-orm";
import { db, doctorPrescriptionTemplatesTable, employeesTable } from "@workspace/db";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const templateDir = path.join(uploadDir, "prescription-templates");
if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

function requireAdminOrManager(req: Request, res: Response, next: NextFunction) {
  const role = (req.session as any)?.role;
  if (role !== "admin" && role !== "manager") { res.status(403).json({ error: "admin_or_manager_required" }); return; }
  next();
}

function safeName(name: string): string {
  return path.basename(name || "template").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, templateDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `rx-template-${Date.now()}-${safeName(file.originalname || `template${ext}`)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
      cb(new Error("Prescription template must be PNG, JPG, WEBP, or SVG."));
      return;
    }
    cb(null, true);
  },
});

router.get("/prescription-templates", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      id: doctorPrescriptionTemplatesTable.id,
      doctorId: doctorPrescriptionTemplatesTable.doctorId,
      name: doctorPrescriptionTemplatesTable.name,
      fileUrl: doctorPrescriptionTemplatesTable.fileUrl,
      fileName: doctorPrescriptionTemplatesTable.fileName,
      mimeType: doctorPrescriptionTemplatesTable.mimeType,
      active: doctorPrescriptionTemplatesTable.active,
      notes: doctorPrescriptionTemplatesTable.notes,
      createdAt: doctorPrescriptionTemplatesTable.createdAt,
      updatedAt: doctorPrescriptionTemplatesTable.updatedAt,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(doctorPrescriptionTemplatesTable)
    .leftJoin(employeesTable, eq(employeesTable.id, doctorPrescriptionTemplatesTable.doctorId))
    .orderBy(desc(doctorPrescriptionTemplatesTable.updatedAt));
  res.json(rows);
});

router.post(
  "/prescription-templates",
  requireAdminOrManager,
  upload.single("template"),
  async (req: Request, res: Response): Promise<void> => {
    const doctorId = Number(req.body?.doctorId);
    const name = String(req.body?.name || "").trim();
    const notes = String(req.body?.notes || "").trim();
    if (!Number.isInteger(doctorId) || doctorId <= 0) { res.status(400).json({ error: "doctor_required" }); return; }
    if (!req.file) { res.status(400).json({ error: "template_file_required" }); return; }
    const [doctor] = await db.select({ id: employeesTable.id }).from(employeesTable).where(eq(employeesTable.id, doctorId));
    if (!doctor) { res.status(400).json({ error: "doctor_not_found" }); return; }

    const publicPath = `/uploads/prescription-templates/${req.file.filename}`;
    const [previous] = await db
      .select()
      .from(doctorPrescriptionTemplatesTable)
      .where(eq(doctorPrescriptionTemplatesTable.doctorId, doctorId))
      .limit(1);
    if (previous?.fileUrl?.startsWith("/uploads/prescription-templates/")) {
      const prevAbs = path.join(uploadDir, previous.fileUrl.replace(/^\/uploads\//, ""));
      fs.promises.unlink(prevAbs).catch(() => {});
    }

    const values = {
      doctorId,
      name: name || req.file.originalname || "Prescription template",
      fileUrl: publicPath,
      fileName: req.file.originalname || null,
      mimeType: req.file.mimetype || null,
      notes: notes || null,
      active: 1,
      updatedAt: new Date(),
    };
    const [row] = await db
      .insert(doctorPrescriptionTemplatesTable)
      .values(values)
      .onConflictDoUpdate({
        target: doctorPrescriptionTemplatesTable.doctorId,
        set: values,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.delete("/prescription-templates/:id", requireAdminOrManager, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .delete(doctorPrescriptionTemplatesTable)
    .where(eq(doctorPrescriptionTemplatesTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  if (row.fileUrl?.startsWith("/uploads/prescription-templates/")) {
    const abs = path.join(uploadDir, row.fileUrl.replace(/^\/uploads\//, ""));
    fs.promises.unlink(abs).catch(() => {});
  }
  res.sendStatus(204);
});

export default router;
