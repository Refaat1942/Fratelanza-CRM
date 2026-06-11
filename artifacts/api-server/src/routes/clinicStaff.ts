import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, clinicStaffTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const templateDir = path.join(uploadDir, "prescription-templates");
if (!fs.existsSync(templateDir)) fs.mkdirSync(templateDir, { recursive: true });

const ALLOWED_TEMPLATE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const ALLOWED_TEMPLATE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const templateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, templateDir),
  filename: (req, file, cb) => {
    const id = Number(req.params.id);
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `doctor-${Number.isFinite(id) ? id : "new"}-${Date.now()}${ext}`);
  },
});
const templateUpload = multer({
  storage: templateStorage,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_TEMPLATE_MIME.has(file.mimetype) || !ALLOWED_TEMPLATE_EXT.has(ext)) {
      cb(new Error("Template must be PNG, JPG, WEBP, or SVG."));
      return;
    }
    cb(null, true);
  },
});

// Only admin or manager may mutate the clinic roster. Read access is granted
// to anyone with `medical` permission (gated upstream in routes/index.ts).
function requireRoster(req: Request, res: Response, next: NextFunction): void {
  const role = (req.session as any)?.user?.role;
  if (role === "admin" || role === "manager") { next(); return; }
  res.status(403).json({ error: "forbidden" });
}

const ROLES = ["doctor", "nurse", "assistant", "receptionist", "technician", "other"] as const;

const StaffInput = z.object({
  name: z.string().trim().max(120).nullable().optional(),
  nameAr: z.string().trim().max(120).nullable().optional(),
  role: z.enum(ROLES).default("doctor"),
  specialty: z.string().trim().max(120).nullable().optional(),
  specialtyAr: z.string().trim().max(120).nullable().optional(),
  licenseNumber: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  prescriptionTemplateUrl: z.string().trim().max(500).nullable().optional(),
  prescriptionHeader: z.string().trim().max(500).nullable().optional(),
  prescriptionHeaderAr: z.string().trim().max(500).nullable().optional(),
  prescriptionFooter: z.string().trim().max(500).nullable().optional(),
  prescriptionFooterAr: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  active: z.boolean().default(true),
}).refine(d => (d.name && d.name.trim()) || (d.nameAr && d.nameAr.trim()), {
  message: "Name (EN or AR) is required",
});

router.get("/clinic-staff", async (_req: Request, res: Response) => {
  const rows = await db.select().from(clinicStaffTable).orderBy(desc(clinicStaffTable.active), clinicStaffTable.role, clinicStaffTable.name);
  res.json(rows);
});

router.post("/clinic-staff", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const parsed = StaffInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(clinicStaffTable).values({
    name: parsed.data.name ?? null,
    nameAr: parsed.data.nameAr ?? null,
    role: parsed.data.role,
    specialty: parsed.data.specialty ?? null,
    specialtyAr: parsed.data.specialtyAr ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    prescriptionTemplateUrl: parsed.data.prescriptionTemplateUrl ?? null,
    prescriptionHeader: parsed.data.prescriptionHeader ?? null,
    prescriptionHeaderAr: parsed.data.prescriptionHeaderAr ?? null,
    prescriptionFooter: parsed.data.prescriptionFooter ?? null,
    prescriptionFooterAr: parsed.data.prescriptionFooterAr ?? null,
    notes: parsed.data.notes ?? null,
    active: parsed.data.active,
  }).returning();
  res.status(201).json(row);
});

router.put("/clinic-staff/:id", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  const parsed = StaffInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  const [row] = await db.update(clinicStaffTable).set({
    name: parsed.data.name ?? null,
    nameAr: parsed.data.nameAr ?? null,
    role: parsed.data.role,
    specialty: parsed.data.specialty ?? null,
    specialtyAr: parsed.data.specialtyAr ?? null,
    licenseNumber: parsed.data.licenseNumber ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    prescriptionTemplateUrl: parsed.data.prescriptionTemplateUrl ?? null,
    prescriptionHeader: parsed.data.prescriptionHeader ?? null,
    prescriptionHeaderAr: parsed.data.prescriptionHeaderAr ?? null,
    prescriptionFooter: parsed.data.prescriptionFooter ?? null,
    prescriptionFooterAr: parsed.data.prescriptionFooterAr ?? null,
    notes: parsed.data.notes ?? null,
    active: parsed.data.active,
  }).where(eq(clinicStaffTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.json(row);
});

router.post("/clinic-staff/:id/prescription-template", requireRoster, templateUpload.single("template"), async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  if (!req.file) { res.status(400).json({ error: "no_file" }); return; }

  const [prev] = await db.select().from(clinicStaffTable).where(eq(clinicStaffTable.id, id));
  if (!prev) { res.status(404).json({ error: "not_found" }); return; }
  if (prev.prescriptionTemplateUrl?.startsWith("/uploads/prescription-templates/")) {
    const prevAbs = path.join(uploadDir, prev.prescriptionTemplateUrl.replace(/^\/uploads\//, ""));
    fs.promises.unlink(prevAbs).catch(() => {});
  }

  const publicPath = `/uploads/prescription-templates/${req.file.filename}`;
  const [row] = await db.update(clinicStaffTable)
    .set({ prescriptionTemplateUrl: publicPath, updatedAt: new Date() })
    .where(eq(clinicStaffTable.id, id))
    .returning();
  res.json(row);
});

router.delete("/clinic-staff/:id/prescription-template", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  const [prev] = await db.select().from(clinicStaffTable).where(eq(clinicStaffTable.id, id));
  if (!prev) { res.status(404).json({ error: "not_found" }); return; }
  if (prev.prescriptionTemplateUrl?.startsWith("/uploads/prescription-templates/")) {
    const prevAbs = path.join(uploadDir, prev.prescriptionTemplateUrl.replace(/^\/uploads\//, ""));
    fs.promises.unlink(prevAbs).catch(() => {});
  }
  const [row] = await db.update(clinicStaffTable)
    .set({ prescriptionTemplateUrl: null, updatedAt: new Date() })
    .where(eq(clinicStaffTable.id, id))
    .returning();
  res.json(row);
});

router.delete("/clinic-staff/:id", requireRoster, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "invalid_id" }); return; }
  await db.delete(clinicStaffTable).where(eq(clinicStaffTable.id, id));
  res.status(204).end();
});

export default router;
