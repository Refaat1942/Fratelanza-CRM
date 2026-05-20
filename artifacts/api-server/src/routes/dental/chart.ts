import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, dentalChartEntriesTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

// FDI tooth numbering: upper-right 11-18, upper-left 21-28, lower-left 31-38, lower-right 41-48.
export const FDI_TEETH = [
  11,12,13,14,15,16,17,18,
  21,22,23,24,25,26,27,28,
  31,32,33,34,35,36,37,38,
  41,42,43,44,45,46,47,48,
] as const;

const CONDITIONS = [
  "healthy", "cavity", "filled", "crown", "root_canal", "missing", "extracted", "implant", "bridge", "other",
] as const;

const ChartEntryInput = z.object({
  condition: z.enum(CONDITIONS),
  notes: z.string().nullable().optional(),
  notesAr: z.string().nullable().optional(),
  updatedByDoctorId: z.number().int().nullable().optional(),
});

// GET full chart for a patient — returns 32 entries, filling missing teeth with default "healthy".
router.get("/patients/:id/dental-chart", async (req, res): Promise<void> => {
  const patientId = parseInt(req.params.id, 10);
  if (!Number.isFinite(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
  const rows = await db.select().from(dentalChartEntriesTable).where(eq(dentalChartEntriesTable.patientId, patientId));
  const byTooth = new Map(rows.map(r => [r.toothNumber, r]));
  const full = FDI_TEETH.map(n => byTooth.get(n) ?? {
    id: null, patientId, toothNumber: n, condition: "healthy",
    notes: null, notesAr: null, updatedByDoctorId: null, createdAt: null, updatedAt: null,
  });
  res.json(full);
});

// Upsert a single tooth entry.
router.put("/patients/:id/dental-chart/:tooth", async (req, res): Promise<void> => {
  const patientId = parseInt(req.params.id, 10);
  const toothNumber = parseInt(req.params.tooth, 10);
  if (!Number.isFinite(patientId)) { res.status(400).json({ error: "Invalid patient id" }); return; }
  if (!FDI_TEETH.includes(toothNumber as (typeof FDI_TEETH)[number])) {
    res.status(400).json({ error: "Invalid tooth number (FDI 11-48 only)" }); return;
  }
  const parsed = ChartEntryInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const existing = await db.select().from(dentalChartEntriesTable)
    .where(and(eq(dentalChartEntriesTable.patientId, patientId), eq(dentalChartEntriesTable.toothNumber, toothNumber)))
    .limit(1);

  if (existing.length > 0) {
    const [row] = await db.update(dentalChartEntriesTable).set(parsed.data)
      .where(eq(dentalChartEntriesTable.id, existing[0].id)).returning();
    res.json(row); return;
  }
  const [row] = await db.insert(dentalChartEntriesTable).values({
    patientId, toothNumber, ...parsed.data,
  }).returning();
  res.status(201).json(row);
});

export default router;
