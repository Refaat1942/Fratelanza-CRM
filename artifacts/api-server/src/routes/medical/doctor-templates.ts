import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, doctorPrescriptionTemplatesTable, employeesTable } from "@workspace/db";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const templateDir = path.join(uploadDir, "prescription-templates");
if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, templateDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `rx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const templateUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(png|jpe?g|webp|pdf)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error("invalid_file_type"));
  },
});

const MetaInput = z.object({
  doctorTitle: z.string().nullable().optional(),
  doctorTitleAr: z.string().nullable().optional(),
  doctorLicense: z.string().nullable().optional(),
  footerText: z.string().nullable().optional(),
  footerTextAr: z.string().nullable().optional(),
});

router.get("/doctor-prescription-templates", async (_req, res) => {
  const rows = await db
    .select({
      id: doctorPrescriptionTemplatesTable.id,
      doctorId: doctorPrescriptionTemplatesTable.doctorId,
      templateUrl: doctorPrescriptionTemplatesTable.templateUrl,
      doctorTitle: doctorPrescriptionTemplatesTable.doctorTitle,
      doctorTitleAr: doctorPrescriptionTemplatesTable.doctorTitleAr,
      doctorLicense: doctorPrescriptionTemplatesTable.doctorLicense,
      footerText: doctorPrescriptionTemplatesTable.footerText,
      footerTextAr: doctorPrescriptionTemplatesTable.footerTextAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(doctorPrescriptionTemplatesTable)
    .leftJoin(employeesTable, eq(employeesTable.id, doctorPrescriptionTemplatesTable.doctorId));
  res.json(rows);
});

router.get("/doctor-prescription-templates/:doctorId", async (req, res): Promise<void> => {
  const doctorId = Number(req.params.doctorId);
  if (!Number.isFinite(doctorId)) { res.status(400).json({ error: "Invalid doctor id" }); return; }
  const [row] = await db
    .select()
    .from(doctorPrescriptionTemplatesTable)
    .where(eq(doctorPrescriptionTemplatesTable.doctorId, doctorId));
  res.json(row ?? null);
});

router.post(
  "/doctor-prescription-templates/:doctorId",
  templateUpload.single("template"),
  async (req: Request, res: Response): Promise<void> => {
    const doctorId = Number(req.params.doctorId);
    if (!Number.isFinite(doctorId)) { res.status(400).json({ error: "Invalid doctor id" }); return; }

    const [doctor] = await db.select({ id: employeesTable.id }).from(employeesTable).where(eq(employeesTable.id, doctorId));
    if (!doctor) { res.status(404).json({ error: "doctor_not_found" }); return; }

    const meta = MetaInput.safeParse(req.body);
    if (!meta.success) { res.status(400).json({ error: meta.error.message }); return; }

    const templateUrl = req.file ? `/uploads/prescription-templates/${req.file.filename}` : undefined;
    const [existing] = await db.select().from(doctorPrescriptionTemplatesTable).where(eq(doctorPrescriptionTemplatesTable.doctorId, doctorId));

    if (existing) {
      if (templateUrl && existing.templateUrl?.startsWith("/uploads/prescription-templates/")) {
        const prev = path.join(uploadDir, existing.templateUrl.replace(/^\/uploads\//, ""));
        fs.unlink(prev, () => {});
      }
      const [row] = await db
        .update(doctorPrescriptionTemplatesTable)
        .set({
          ...(templateUrl ? { templateUrl } : {}),
          ...meta.data,
          updatedAt: new Date(),
        })
        .where(eq(doctorPrescriptionTemplatesTable.doctorId, doctorId))
        .returning();
      res.json(row);
      return;
    }

    if (!templateUrl) { res.status(400).json({ error: "template_file_required" }); return; }
    const [row] = await db.insert(doctorPrescriptionTemplatesTable).values({
      doctorId,
      templateUrl,
      ...meta.data,
    }).returning();
    res.status(201).json(row);
  },
);

router.delete("/doctor-prescription-templates/:doctorId", async (req, res): Promise<void> => {
  const doctorId = Number(req.params.doctorId);
  if (!Number.isFinite(doctorId)) { res.status(400).json({ error: "Invalid doctor id" }); return; }
  const [row] = await db.delete(doctorPrescriptionTemplatesTable).where(eq(doctorPrescriptionTemplatesTable.doctorId, doctorId)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (row.templateUrl?.startsWith("/uploads/prescription-templates/")) {
    const abs = path.join(uploadDir, row.templateUrl.replace(/^\/uploads\//, ""));
    fs.unlink(abs, () => {});
  }
  res.sendStatus(204);
});

export default router;
