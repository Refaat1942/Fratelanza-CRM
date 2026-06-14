import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql, or, ilike } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { medicineMasterTable } from "@workspace/db";
import type * as DbSchema from "@workspace/db/schema";
import { z } from "zod";
import multer from "multer";
import ExcelJS from "exceljs";
import crypto from "node:crypto";
import {
  assertPostgresDatabase,
  continueWithRequestTenant,
  freezeTenantDbMiddleware,
  getRequestDb,
  getRequestDbName,
  postgresCurrentDatabase,
  requireFrozenTenantDb,
} from "../../lib/tenantContext";

type AppDb = NodePgDatabase<typeof DbSchema>;

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
  return code === "42P01" || (/medicine_master/i.test(msg) && /does not exist|undefined table/i.test(msg));
}

function sendDbSetupError(res: Response): void {
  res.status(503).json({
    error: "medicine_master_table_missing",
    hint: "Run: ./deploy/migrate-tenants.sh deploy/migrations/011-medical-extensions.sql",
  });
}

async function parseSpreadsheet(buffer: Buffer, filename: string): Promise<{ material: string; materialDescription: string; bun: string | null }[]> {
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

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = wb.worksheets[0];
  if (!sheet) return rows;
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, col) => { headers[col - 1] = String(cell.value ?? "").trim(); });

  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const obj: Record<string, unknown> = {};
    row.eachCell((cell, col) => {
      const h = headers[col - 1];
      if (h) obj[h] = cell.value;
    });
    const picked = pickRow(obj);
    if (picked) rows.push(picked);
  });
  return rows;
}

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const code = (err as { code?: string }).code;
      res.status(400).json({ error: code === "LIMIT_FILE_SIZE" ? "file_too_large" : "upload_failed" });
      return;
    }
    continueWithRequestTenant(req, next);
  });
};

async function countMedicines(tenantDb: AppDb): Promise<number> {
  const [row] = await tenantDb.select({ total: sql<number>`cast(count(*) as int)` }).from(medicineMasterTable);
  return row?.total ?? 0;
}

async function upsertBatch(
  tenantDb: AppDb,
  batch: { material: string; materialDescription: string; bun: string | null }[],
) {
  if (!batch.length) return;
  await tenantDb.insert(medicineMasterTable).values(batch).onConflictDoUpdate({
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
    const tenantDb = getRequestDb(req);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    let q = tenantDb.select().from(medicineMasterTable).$dynamic();
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

router.get("/medicine-master/stats", async (req, res) => {
  try {
    const tenantDb = getRequestDb(req);
    const total = await countMedicines(tenantDb);
    res.json({ total, dbName: getRequestDbName(req) });
  } catch (err) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    throw err;
  }
});

router.post("/medicine-master", async (req: Request, res: Response): Promise<void> => {
  const parsed = MedicineInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const tenantDb = requireFrozenTenantDb(req).db;
    const [row] = await tenantDb.insert(medicineMasterTable).values({
      material: parsed.data.material.trim(),
      materialDescription: parsed.data.materialDescription.trim(),
      bun: parsed.data.bun?.trim() || null,
      active: parsed.data.active ?? 1,
    }).returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    if (isMissingTable(err)) { sendDbSetupError(res); return; }
    if ((err as Error).message === "tenant_binding_missing") {
      res.status(500).json({ error: "tenant_binding_missing" });
      return;
    }
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
  const tenantDb = requireFrozenTenantDb(req).db;
  const [row] = await tenantDb.update(medicineMasterTable).set(parsed.data).where(eq(medicineMasterTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/medicine-master/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const tenantDb = requireFrozenTenantDb(req).db;
  const [row] = await tenantDb.delete(medicineMasterTable).where(eq(medicineMasterTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.post(
  "/medicine-master/upload",
  freezeTenantDbMiddleware,
  uploadMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const { db: tenantDb, dbName, subdomain, usesBindingDb } = requireFrozenTenantDb(req);

    if (!req.file) {
      res.status(400).json({ error: "file_required" });
      return;
    }

    try {
      const postgresDbBefore = await postgresCurrentDatabase(tenantDb);

      if (subdomain && process.env.ADMIN_API_URL && postgresDbBefore !== dbName) {
        res.status(500).json({
          error: "wrong_postgres_database",
          subdomain,
          dbName,
          postgresDatabase: postgresDbBefore,
          usesBindingDb,
          hint: "Upload refused — connection is not on the tenant database",
        });
        return;
      }

      await assertPostgresDatabase(tenantDb, dbName);

      const parsed = dedupeRows(await parseSpreadsheet(req.file.buffer, req.file.originalname));
      if (parsed.length === 0) {
        res.status(400).json({
          error: "no_valid_rows",
          hint: "Use columns: Material, Material description, BUn (first row = headers)",
        });
        return;
      }

      const before = await countMedicines(tenantDb);
      let skipped = 0;

      for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
        const batch = parsed.slice(i, i + BATCH_SIZE);
        try {
          await upsertBatch(tenantDb, batch);
        } catch {
          skipped += batch.length;
        }
      }

      const after = await countMedicines(tenantDb);
      const postgresDbAfter = await postgresCurrentDatabase(tenantDb);
      const inserted = Math.max(0, after - before);
      const updated = Math.max(0, parsed.length - inserted - skipped);

      res.json({
        inserted,
        updated,
        skipped,
        total: parsed.length,
        inDb: after,
        dbName,
        subdomain,
        postgresDatabase: postgresDbAfter,
        usesTenantBindingDb: usesBindingDb,
      });
    } catch (err) {
      if ((err as Error).message === "tenant_binding_missing") {
        res.status(500).json({ error: "tenant_binding_missing", hint: "Tenant DB was not frozen before upload" });
        return;
      }
      if ((err as Error).message.startsWith("wrong_postgres_database:")) {
        const parts = (err as Error).message.split(":");
        res.status(500).json({
          error: "wrong_postgres_database",
          postgresDatabase: parts[1],
          expectedDatabase: parts[3],
          dbName,
          subdomain,
          usesBindingDb,
        });
        return;
      }
      if (isMissingTable(err)) { sendDbSetupError(res); return; }
      const msg = err instanceof Error ? err.message : "parse_failed";
      res.status(400).json({ error: "upload_parse_failed", message: msg });
    }
  },
);

export default router;
