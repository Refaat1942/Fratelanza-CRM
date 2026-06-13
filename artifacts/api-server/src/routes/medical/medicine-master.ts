import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql, or, ilike } from "drizzle-orm";
import { db, medicineMasterTable } from "@workspace/db";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";
import { withRequestTenant } from "../../lib/tenantContext";
import crypto from "node:crypto";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const BATCH_SIZE = 400;

const MedicineInput = z.object({
  material: z.string().min(1),
  materialDescription: z.string().min(1),
  bun: z.string().nullable().optional(),
  active: z.number().int().min(0).max(1).optional(),
});

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
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
    if (nk === "material" || nk === "material code" || nk === "mat" || nk === "code" || nk === "material no") material = s;
    else if (nk === "material description" || nk === "description" || nk === "material desc" || nk === "desc" || nk === "name") materialDescription = s;
    else if (nk === "bun" || nk === "base unit" || nk === "unit" || nk === "uom") bun = s;
  }

  if (!material && !materialDescription) return null;
  if (!materialDescription) materialDescription = material;
  if (!material) {
    // Stable unique key when SAP Material code column is missing/empty.
    const hash = crypto.createHash("sha1").update(materialDescription).digest("hex").slice(0, 12);
    material = `M-${hash}`;
  }
  return { material, materialDescription, bun };
}

function dedupeRows(rows: { material: string; materialDescription: string; bun: string | null }[]) {
  const map = new Map<string, { material: string; materialDescription: string; bun: string | null }>();
  for (const r of rows) map.set(r.material, r);
  return [...map.values()];
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

async function countMedicines(): Promise<number> {
  const [row] = await db.select({ total: sql<number>`cast(count(*) as int)` }).from(medicineMasterTable);
  return row?.total ?? 0;
}

async function upsertBatch(batch: { material: string; materialDescription: string; bun: string | null }[]) {
  if (!batch.length) return;
  await db.insert(medicineMasterTable).values(batch).onConflictDoUpdate({
    target: medicineMasterTable.material,
    set: {
      materialDescription: sql`excluded.material_description`,
      bun: sql`excluded.bun`,
      updatedAt: sql`now()`,
    },
  });
}

router.get("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(500, Math.max(50, Number(req.query.pageSize) || 100));
    const offset = (page - 1) * pageSize;

    let q = db.select().from(medicineMasterTable).$dynamic();
    if (search) {
      const cond = or(
        ilike(medicineMasterTable.material, `%${search}%`),
        ilike(medicineMasterTable.materialDescription, `%${search}%`),
        ilike(medicineMasterTable.bun, `%${search}%`),
      );
      q = q.where(cond);
    }
    const rows = await q.orderBy(desc(medicineMasterTable.updatedAt)).limit(pageSize).offset(offset);
    const total = search
      ? (await db.select({ total: sql<number>`cast(count(*) as int)` }).from(medicineMasterTable).where(or(
        ilike(medicineMasterTable.material, `%${search}%`),
        ilike(medicineMasterTable.materialDescription, `%${search}%`),
        ilike(medicineMasterTable.bun, `%${search}%`),
      )!))[0]?.total ?? 0
      : await countMedicines();

    res.json({ items: rows, total, page, pageSize });
  } catch (err) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    throw err;
  }
});

router.get("/medicine-master/stats", async (_req, res) => {
  try {
    const total = await countMedicines();
    res.json({ total });
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
  await withRequestTenant(req, async () => {
    if (!req.file) { res.status(400).json({ error: "file_required" }); return; }

    try {
      const parsed = dedupeRows(parseSpreadsheet(req.file.buffer, req.file.originalname));
      if (parsed.length === 0) {
        res.status(400).json({
          error: "no_valid_rows",
          hint: "Use columns: Material, Material description, BUn (first row = headers)",
        });
        return;
      }

      const before = await countMedicines();
      let skipped = 0;

      for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
        const batch = parsed.slice(i, i + BATCH_SIZE);
        try {
          await upsertBatch(batch);
        } catch {
          skipped += batch.length;
        }
      }

      const after = await countMedicines();
      const inserted = Math.max(0, after - before);
      const updated = Math.max(0, parsed.length - inserted - skipped);

      res.json({
        inserted,
        updated,
        skipped,
        total: parsed.length,
        inDb: after,
      });
    } catch (err) {
      if (isMissingTable(err)) { sendDbSetupError(res); return; }
      const msg = err instanceof Error ? err.message : "parse_failed";
      res.status(400).json({ error: "upload_parse_failed", message: msg });
    }
  });
});

export default router;
