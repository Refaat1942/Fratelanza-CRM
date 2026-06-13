import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql, or, ilike } from "drizzle-orm";
import { db, medicineMasterTable } from "@workspace/db";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const MedicineInput = z.object({
  material: z.string().min(1),
  materialDescription: z.string().min(1),
  bun: z.string().nullable().optional(),
  active: z.number().int().min(0).max(1).optional(),
});

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function cellToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v).trim();
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object" && v !== null) {
    if ("text" in v && typeof (v as { text?: string }).text === "string") return (v as { text: string }).text.trim();
    if ("result" in v) return cellToString((v as { result?: unknown }).result);
    if ("richText" in v && Array.isArray((v as { richText?: { text?: string }[] }).richText)) {
      return ((v as { richText: { text?: string }[] }).richText).map((r) => r.text ?? "").join("").trim();
    }
  }
  return String(v).trim();
}

function pickRow(row: Record<string, unknown>): { material: string; materialDescription: string; bun: string | null } | null {
  const keys = Object.keys(row);
  let material = "";
  let materialDescription = "";
  let bun: string | null = null;

  for (const k of keys) {
    const nk = normalizeHeader(k);
    const s = cellToString(row[k]);
    if (!s) continue;
    if (nk === "material" || nk === "material code" || nk === "mat" || nk === "code") material = s;
    else if (nk === "material description" || nk === "description" || nk === "material desc" || nk === "desc") materialDescription = s;
    else if (nk === "bun" || nk === "base unit" || nk === "unit" || nk === "uom") bun = s;
  }

  if (!material && !materialDescription) return null;
  if (!material) material = materialDescription.slice(0, 64);
  if (!materialDescription) materialDescription = material;
  return { material, materialDescription, bun };
}

function isMissingTable(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = (err as { message?: string })?.message ?? "";
  return code === "42P01" || /medicine_master/i.test(msg) && /does not exist|undefined table/i.test(msg);
}

function sendDbSetupError(res: Response): void {
  res.status(503).json({
    error: "medicine_master_table_missing",
    hint: "Run: ./deploy/migrate-tenants.sh deploy/migrations/011-medical-extensions.sql",
  });
}

function parseSpreadsheet(buffer: Buffer, filename: string): { material: string; materialDescription: string; bun: string | null }[] {
  const rows: { material: string; materialDescription: string; bun: string | null }[] = [];
  const name = filename.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = buffer.toString("utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return rows;
    const headers = lines[0]!.split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, ""));
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => { obj[h] = cols[idx] ?? ""; });
      const picked = pickRow(obj);
      if (picked) rows.push(picked);
    }
    return rows;
  }

  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return rows;
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]!, { defval: "" });
  for (const row of json) {
    const picked = pickRow(row);
    if (picked) rows.push(picked);
  }
  return rows;
}

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const code = (err as { code?: string }).code;
      res.status(400).json({ error: code === "LIMIT_FILE_SIZE" ? "file_too_large" : "upload_failed" });
      return;
    }
    next();
  });
};

router.get("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    let q = db.select().from(medicineMasterTable).$dynamic();
    if (search) {
      const cond = or(
        ilike(medicineMasterTable.material, `%${search}%`),
        ilike(medicineMasterTable.materialDescription, `%${search}%`),
        ilike(medicineMasterTable.bun, `%${search}%`),
      );
      q = q.where(cond);
    }
    const rows = await q.orderBy(desc(medicineMasterTable.updatedAt)).limit(1000);
    res.json(rows);
  } catch (err) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    throw err;
  }
});

router.get("/medicine-master/stats", async (_req, res) => {
  try {
    const [row] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(medicineMasterTable);
    res.json(row);
  } catch (err) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    throw err;
  }
});

router.post("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  const parsed = MedicineInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [row] = await db.insert(medicineMasterTable).values({
      material: parsed.data.material.trim(),
      materialDescription: parsed.data.materialDescription.trim(),
      bun: parsed.data.bun?.trim() || null,
      active: parsed.data.active ?? 1,
    }).returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    const code = (err as { code?: string })?.code;
    if (code === "23505") { res.status(409).json({ error: "material_exists" }); return; }
    throw err;
  }
});

router.patch("/medicine-master/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = MedicineInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(medicineMasterTable).set(parsed.data).where(eq(medicineMasterTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/medicine-master/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(medicineMasterTable).where(eq(medicineMasterTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post("/medicine-master/upload", uploadMiddleware, async (req: Request, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "file_required" }); return; }

  try {
    const rows = parseSpreadsheet(req.file.buffer, req.file.originalname);
    if (rows.length === 0) {
      res.status(400).json({
        error: "no_valid_rows",
        hint: "Use columns: Material, Material description, BUn (first row = headers)",
      });
      return;
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of rows) {
      const existing = await db.select({ id: medicineMasterTable.id }).from(medicineMasterTable).where(eq(medicineMasterTable.material, r.material));
      if (existing.length > 0) {
        await db.update(medicineMasterTable).set({
          materialDescription: r.materialDescription,
          bun: r.bun,
          updatedAt: new Date(),
        }).where(eq(medicineMasterTable.id, existing[0]!.id));
        updated++;
      } else {
        try {
          await db.insert(medicineMasterTable).values(r);
          inserted++;
        } catch {
          skipped++;
        }
      }
    }

    res.json({ inserted, updated, skipped, total: rows.length });
  } catch (err) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    const msg = err instanceof Error ? err.message : "parse_failed";
    res.status(400).json({ error: "upload_parse_failed", message: msg });
  }
});

export default router;
