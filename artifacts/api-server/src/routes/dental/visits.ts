import { Router, type IRouter } from "express";
import { and, eq, desc, sql } from "drizzle-orm";
import { db, dentalVisitsTable, patientsTable, employeesTable, dentalProceduresTable } from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { z } from "zod";

const router: IRouter = Router();

const FDI_TEETH = [
  11,12,13,14,15,16,17,18,
  21,22,23,24,25,26,27,28,
  31,32,33,34,35,36,37,38,
  41,42,43,44,45,46,47,48,
];

const VisitInput = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive().nullable().optional(),
  visitDate: z.string().optional(), // ISO; defaults to now
  toothNumber: z.number().int().refine(n => FDI_TEETH.includes(n), { message: "Invalid tooth (FDI)" }).nullable().optional(),
  procedureId: z.number().int().positive().nullable().optional(),
  treatmentType: z.string().nullable().optional(),
  treatmentTypeAr: z.string().nullable().optional(),
  materialsUsed: z.string().nullable().optional(),
  materialsUsedAr: z.string().nullable().optional(),
  cost: z.number().nonnegative().default(0),
  notes: z.string().nullable().optional(),
  notesAr: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(), // YYYY-MM-DD
});

router.get("/dental-visits", async (req, res): Promise<void> => {
  const patientId = req.query.patient ? parseInt(String(req.query.patient), 10) : null;
  const conditions: any[] = [];
  if (patientId && Number.isFinite(patientId)) {
    conditions.push(eq(dentalVisitsTable.patientId, patientId));
  }
  const bw = branchWhere(req, dentalVisitsTable.branchId);
  if (bw) conditions.push(bw);
  const rows = await db
    .select({
      v: dentalVisitsTable,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
      procedureName: dentalProceduresTable.name,
      procedureNameAr: dentalProceduresTable.nameAr,
    })
    .from(dentalVisitsTable)
    .leftJoin(patientsTable, eq(patientsTable.id, dentalVisitsTable.patientId))
    .leftJoin(employeesTable, eq(employeesTable.id, dentalVisitsTable.doctorId))
    .leftJoin(dentalProceduresTable, eq(dentalProceduresTable.id, dentalVisitsTable.procedureId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dentalVisitsTable.visitDate))
    .limit(500);

  res.json(rows.map(r => ({
    ...r.v,
    patientName: [r.patientFirstName, r.patientLastName].filter(Boolean).join(" ") || null,
    patientNameAr: [r.patientFirstNameAr, r.patientLastNameAr].filter(Boolean).join(" ") || null,
    doctorName: r.doctorName,
    doctorNameAr: r.doctorNameAr,
    procedureName: r.procedureName,
    procedureNameAr: r.procedureNameAr,
  })));
});

router.post("/dental-visits", async (req, res): Promise<void> => {
  const parsed = VisitInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: any = { ...parsed.data };
  if (parsed.data.visitDate) data.visitDate = new Date(parsed.data.visitDate);
  const [row] = await db.insert(dentalVisitsTable).values(data).returning();
  res.status(201).json(row);
});

router.patch("/dental-visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = VisitInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: any = { ...parsed.data };
  if (parsed.data.visitDate) data.visitDate = new Date(parsed.data.visitDate);
  const [row] = await db.update(dentalVisitsTable).set(data).where(eq(dentalVisitsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(row);
});

router.delete("/dental-visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.delete(dentalVisitsTable).where(eq(dentalVisitsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Visit not found" }); return; }
  res.sendStatus(204);
});

router.get("/dental-visits/stats", async (_req, res): Promise<void> => {
  const [{ count, revenue }] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      revenue: sql<number>`COALESCE(SUM(${dentalVisitsTable.cost}), 0)::float`,
    })
    .from(dentalVisitsTable);
  res.json({ count, revenue });
});

export default router;
