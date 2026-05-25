import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, tenantSettingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const logoDir = path.join(uploadDir, "logos");
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const ALLOWED_LOGO_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const ALLOWED_LOGO_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logoDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_LOGO_MIME.has(file.mimetype) || !ALLOWED_LOGO_EXT.has(ext)) {
      cb(new Error("Logo must be PNG, JPG, WEBP, or SVG."));
      return;
    }
    cb(null, true);
  },
});

async function ensureRow() {
  await db.execute(sql`INSERT INTO tenant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
}

async function getSettings() {
  await ensureRow();
  const rows = await db.select().from(tenantSettingsTable).where(eq(tenantSettingsTable.id, 1)).limit(1);
  return rows[0];
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const s = req.session as any;
  if (s?.role !== "admin") { res.status(403).json({ error: "admin_required" }); return; }
  next();
}

// PUBLIC: used by the login page (before auth). Returns only display-safe fields.
router.get("/branding/public", async (_req, res) => {
  try {
    const row = await getSettings();
    res.json({
      companyName: row?.companyName || null,
      companyNameAr: row?.companyNameAr || null,
      logoUrl: row?.logoUrl || null,
      primaryColor: row?.primaryColor || null,
    });
  } catch {
    res.json({ companyName: null, companyNameAr: null, logoUrl: null, primaryColor: null });
  }
});

// Authenticated: full settings for anyone logged in (so AppLayout can render it).
router.get("/settings/branding", async (_req, res) => {
  const row = await getSettings();
  res.json(row);
});

const BrandingInput = z.object({
  companyName: z.string().trim().max(120).optional().nullable(),
  companyNameAr: z.string().trim().max(120).optional().nullable(),
  primaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "primary_color must be #rrggbb").optional().nullable(),
  clinicPhone: z.string().trim().max(40).optional().nullable(),
  clinicAddress: z.string().trim().max(300).optional().nullable(),
  clinicAddressAr: z.string().trim().max(300).optional().nullable(),
  doctorTitle: z.string().trim().max(120).optional().nullable(),
  doctorTitleAr: z.string().trim().max(120).optional().nullable(),
  doctorLicense: z.string().trim().max(80).optional().nullable(),
  prescriptionFooter: z.string().trim().max(500).optional().nullable(),
  prescriptionFooterAr: z.string().trim().max(500).optional().nullable(),
});

router.put("/settings/branding", requireAdmin, async (req, res) => {
  const parsed = BrandingInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input", issues: parsed.error.issues }); return; }
  await ensureRow();
  // Merge: only update fields actually present in the request body. This lets
  // the two settings cards (BrandingCard and PrescriptionHeaderCard) save
  // independently without clobbering each other's fields.
  const sent = (k: string) => Object.prototype.hasOwnProperty.call(req.body ?? {}, k);
  const update: Partial<typeof tenantSettingsTable.$inferInsert> = {};
  if (sent("companyName"))         update.companyName         = parsed.data.companyName         ?? null;
  if (sent("companyNameAr"))       update.companyNameAr       = parsed.data.companyNameAr       ?? null;
  if (sent("primaryColor"))        update.primaryColor        = parsed.data.primaryColor        ?? null;
  if (sent("clinicPhone"))         update.clinicPhone         = parsed.data.clinicPhone         ?? null;
  if (sent("clinicAddress"))       update.clinicAddress       = parsed.data.clinicAddress       ?? null;
  if (sent("clinicAddressAr"))     update.clinicAddressAr     = parsed.data.clinicAddressAr     ?? null;
  if (sent("doctorTitle"))         update.doctorTitle         = parsed.data.doctorTitle         ?? null;
  if (sent("doctorTitleAr"))       update.doctorTitleAr       = parsed.data.doctorTitleAr       ?? null;
  if (sent("doctorLicense"))       update.doctorLicense       = parsed.data.doctorLicense       ?? null;
  if (sent("prescriptionFooter"))  update.prescriptionFooter  = parsed.data.prescriptionFooter  ?? null;
  if (sent("prescriptionFooterAr"))update.prescriptionFooterAr= parsed.data.prescriptionFooterAr?? null;
  if (Object.keys(update).length > 0) {
    await db.update(tenantSettingsTable).set(update).where(eq(tenantSettingsTable.id, 1));
  }
  const row = await getSettings();
  res.json(row);
});

router.post("/settings/branding/logo", requireAdmin, logoUpload.single("logo"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "no_file" }); return; }
  await ensureRow();
  const publicPath = `/uploads/logos/${req.file.filename}`;
  // Remove the previous logo file (best-effort).
  const prev = await getSettings();
  if (prev?.logoUrl && prev.logoUrl.startsWith("/uploads/logos/")) {
    const prevAbs = path.join(uploadDir, prev.logoUrl.replace(/^\/uploads\//, ""));
    fs.promises.unlink(prevAbs).catch(() => {});
  }
  await db.update(tenantSettingsTable).set({ logoUrl: publicPath }).where(eq(tenantSettingsTable.id, 1));
  const row = await getSettings();
  res.json(row);
});

router.delete("/settings/branding/logo", requireAdmin, async (_req, res) => {
  const prev = await getSettings();
  if (prev?.logoUrl && prev.logoUrl.startsWith("/uploads/logos/")) {
    const prevAbs = path.join(uploadDir, prev.logoUrl.replace(/^\/uploads\//, ""));
    fs.promises.unlink(prevAbs).catch(() => {});
  }
  await db.update(tenantSettingsTable).set({ logoUrl: null }).where(eq(tenantSettingsTable.id, 1));
  const row = await getSettings();
  res.json(row);
});

export default router;
