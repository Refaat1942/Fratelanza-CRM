import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  db,
  prescriptionsTable,
  visitsTable,
  patientsTable,
  employeesTable,
} from "@workspace/db";
import { sendExcel } from "../../lib/excelExport";
import { z } from "zod";

const router: IRouter = Router();

const PrescriptionInput = z.object({
  visitId: z.number().int().positive(),
  medicineName: z.string().min(1),
  medicineNameAr: z.string().nullable().optional(),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  durationDays: z.number().int().positive().nullable().optional(),
  instructions: z.string().nullable().optional(),
  instructionsAr: z.string().nullable().optional(),
});

// List — joins visit + patient for display. Optional ?patient=&visit= filters.
router.get("/prescriptions", async (req: Request, res: Response): Promise<void> => {
  const patientId = req.query.patient ? Number(req.query.patient) : null;
  const visitId = req.query.visit ? Number(req.query.visit) : null;
  const whereParts: any[] = [];
  if (visitId && Number.isFinite(visitId)) whereParts.push(eq(prescriptionsTable.visitId, visitId));
  if (patientId && Number.isFinite(patientId)) whereParts.push(eq(visitsTable.patientId, patientId));

  const rows = await db
    .select({
      id: prescriptionsTable.id,
      visitId: prescriptionsTable.visitId,
      medicineName: prescriptionsTable.medicineName,
      medicineNameAr: prescriptionsTable.medicineNameAr,
      dosage: prescriptionsTable.dosage,
      frequency: prescriptionsTable.frequency,
      durationDays: prescriptionsTable.durationDays,
      instructions: prescriptionsTable.instructions,
      instructionsAr: prescriptionsTable.instructionsAr,
      createdAt: prescriptionsTable.createdAt,
      patientId: visitsTable.patientId,
      visitDate: visitsTable.visitDate,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(prescriptionsTable)
    .leftJoin(visitsTable, eq(visitsTable.id, prescriptionsTable.visitId))
    .leftJoin(patientsTable, eq(patientsTable.id, visitsTable.patientId))
    .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(desc(prescriptionsTable.createdAt))
    .limit(500);
  res.json(rows);
});

router.get("/prescriptions/export.xlsx", async (req: Request, res: Response): Promise<void> => {
  const patientId = req.query.patient ? Number(req.query.patient) : null;
  const visitId = req.query.visit ? Number(req.query.visit) : null;
  const whereParts: any[] = [];
  if (visitId && Number.isFinite(visitId)) whereParts.push(eq(prescriptionsTable.visitId, visitId));
  if (patientId && Number.isFinite(patientId)) whereParts.push(eq(visitsTable.patientId, patientId));
  const rows = await db
    .select({
      id: prescriptionsTable.id,
      medicineName: prescriptionsTable.medicineName,
      dosage: prescriptionsTable.dosage,
      frequency: prescriptionsTable.frequency,
      durationDays: prescriptionsTable.durationDays,
      patientFirstName: patientsTable.firstName,
      patientLastName: patientsTable.lastName,
      doctorName: employeesTable.name,
      visitDate: visitsTable.visitDate,
    })
    .from(prescriptionsTable)
    .leftJoin(visitsTable, eq(visitsTable.id, prescriptionsTable.visitId))
    .leftJoin(patientsTable, eq(patientsTable.id, visitsTable.patientId))
    .leftJoin(employeesTable, eq(employeesTable.id, visitsTable.doctorId))
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(desc(prescriptionsTable.createdAt))
    .limit(5000);
  await sendExcel(res, "prescriptions.xlsx", "Prescriptions", [
    { header: "Medicine", key: "medicineName" },
    { header: "Patient", key: "patientFirstName", format: (r) => `${r.patientFirstName ?? ""} ${r.patientLastName ?? ""}`.trim() },
    { header: "Doctor", key: "doctorName" },
    { header: "Dosage", key: "dosage" },
    { header: "Frequency", key: "frequency" },
    { header: "Days", key: "durationDays" },
    { header: "Visit Date", key: "visitDate", format: (r) => String(r.visitDate ?? "") },
  ], rows as Record<string, unknown>[]);
});

router.post("/prescriptions", async (req: Request, res: Response): Promise<void> => {
  const parsed = PrescriptionInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  // Make sure the visit exists so we don't end up with orphan prescriptions.
  const [v] = await db.select({ id: visitsTable.id }).from(visitsTable).where(eq(visitsTable.id, parsed.data.visitId));
  if (!v) { res.status(400).json({ error: "visit_not_found" }); return; }
  const [row] = await db.insert(prescriptionsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/prescriptions/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = PrescriptionInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(prescriptionsTable).set(parsed.data).where(eq(prescriptionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/prescriptions/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(prescriptionsTable).where(eq(prescriptionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

// Quick stats for the page header
router.get("/prescriptions-stats", async (_req: Request, res: Response): Promise<void> => {
  const [counts] = await db.execute<{ total: string; last7: string; last30: string }>(
    sql`SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::text AS last7,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::text AS last30
    FROM prescriptions`
  ) as unknown as [{ total: string; last7: string; last30: string }];
  res.json({
    total: Number(counts?.total ?? 0),
    last7: Number(counts?.last7 ?? 0),
    last30: Number(counts?.last30 ?? 0),
  });
});

export default router;
