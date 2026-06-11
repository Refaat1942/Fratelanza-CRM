import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, sql, or, ilike } from "drizzle-orm";
import { db, medicineMasterTable } from "@workspace/db";
import { z } from "zod";
import multer from "multer";
import ExcelJS from "exceljs";

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

function pickRow(row: Record<string, unknown>): { material: string; materialDescription: string; bun: string | null } | null {
  const keys = Object.keys(row);
  let material = "";
  let materialDescription = "";
  let bun: string | null = null;

  for (const k of keys) {
    const nk = normalizeHeader(k);
    const v = row[k];
    const s = v == null ? "" : String(v).trim();
    if (!s) continue;
    if (nk === "material" || nk === "material code" || nk === "mat") material = s;
    else if (nk === "material description" || nk === "description" || nk === "material desc") materialDescription = s;
    else if (nk === "bun" || nk === "base unit" || nk === "unit") bun = s;
  }

  if (!material && !materialDescription) return null;
  if (!material) material = materialDescription.slice(0, 32);
  if (!materialDescription) materialDescription = material;
  return { material, materialDescription, bun };
}

router.get("/medicine-master", async (req: Request, res: Response): Promise<void> => {
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
});

router.get("/medicine-master/stats", async (_req, res) => {
  const [row] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(medicineMasterTable);
  res.json(row);
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

router.post("/medicine-master/upload", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "file_required" }); return; }

  const rows: { material: string; materialDescription: string; bun: string | null }[] = [];
  const name = req.file.originalname.toLowerCase();

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer as unknown as ExcelJS.Buffer);
    const sheet = wb.worksheets[0];
    if (!sheet) { res.status(400).json({ error: "empty_workbook" }); return; }
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
  } else {
    // CSV fallback: first line = headers
    const text = req.file.buffer.toString("utf8");
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { res.status(400).json({ error: "empty_file" }); return; }
    const headers = lines[0]!.split(/[,;\t]/).map(h => h.trim().replace(/^"|"$/g, ""));
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => { obj[h] = cols[idx] ?? ""; });
      const picked = pickRow(obj);
      if (picked) rows.push(picked);
    }
  }

  if (rows.length === 0) { res.status(400).json({ error: "no_valid_rows" }); return; }

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
});

export default router;
