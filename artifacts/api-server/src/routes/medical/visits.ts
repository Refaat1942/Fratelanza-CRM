import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, visitsTable, patientsTable, employeesTable } from "@workspace/db";
import { branchWhere } from "../../lib/branchScope";
import { z } from "zod";

const router: IRouter = Router();

const VisitInput = z.object({
  patientId: z.number().int().positive(),
  appointmentId: z.number().int().positive().nullable().optional(),
  doctorId: z.number().int().positive().nullable().optional(),
  visitDate: z.string().optional(), // ISO datetime; defaults to now
  chiefComplaint: z.string().nullable().optional(),
  chiefComplaintAr: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  diagnosisAr: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  treatmentAr: z.string().nullable().optional(),
  followUpDate: z.string().nullable().optional(), // YYYY-MM-DD
  notes: z.string().nullable().optional(),
});

// Joined select so the frontend doesn't N+1
async function selectVisits(where?: any) {
  const q = db
    .select({
      id: visitsTable.id,
      patientId: visitsTable.patientId,
      appointmentId: visitsTable.appointmentId,
      doctorId: visitsTable.doctorId,
      visitDate: visitsTable.visitDate,
      chiefComplaint: visitsTable.chiefComplaint,
      chiefComplaintAr: visitsTable.chiefComplaintAr,
      diagnosis: visitsTable.diagnosis,
      diagnosisAr: visitsTable.diagnosisAr,
      treatment: visitsTable.treatment,
      treatmentAr: visitsTable.treatmentAr,
      followUpDate: visitsTable.followUpDate,
      notes: visitsTable.notes,
      createdAt: visitsTable.createdAt,
      patientFirstName: patientsTable.firstName,
      patientFirstNameAr: patientsTable.firstNameAr,
      patientLastName: patientsTable.lastName,
      patientLastNameAr: patientsTable.lastNameAr,
      patientPhone: patientsTable.phone,
      doctorName: employeesTable.name,
      doctorNameAr: employeesTable.nameAr,
    })
    .from(visitsTable)
    .leftJoin(patientsTable, eq(visitsTable.patientId, patientsTable.id))
    .leftJoin(employeesTable, eq(visitsTable.doctorId, employeesTable.id))
    .$dynamic();
  return where
    ? await q.where(where).orderBy(desc(visitsTable.visitDate))
    : await q.orderBy(desc(visitsTable.visitDate));
}

router.get("/visits", async (req, res): Promise<void> => {
  const conds: any[] = [];
  if (typeof req.query.patientId === "string") {
    const pid = parseInt(req.query.patientId, 10);
    if (Number.isFinite(pid)) conds.push(eq(visitsTable.patientId, pid));
  }
  if (typeof req.query.doctorId === "string") {
    const did = parseInt(req.query.doctorId, 10);
    if (Number.isFinite(did)) conds.push(eq(visitsTable.doctorId, did));
  }
  const bw = branchWhere(req, visitsTable.branchId);
  if (bw) conds.push(bw);
  const where = conds.length ? and(...conds) : undefined;
  const rows = await selectVisits(where);
  res.json(rows);
});

router.get("/visits/stats", async (req, res): Promise<void> => {
  const bw = branchWhere(req, visitsTable.branchId);
  const w = (c: any) => bw ? and(c, bw)! : c;
  const [today] = await db
    .select({ c: sql<number>`cast(count(*) as int)` })
    .from(visitsTable)
    .where(w(sql`${visitsTable.visitDate}::date = current_date`));
  const [week] = await db
    .select({ c: sql<number>`cast(count(*) as int)` })
    .from(visitsTable)
    .where(w(sql`${visitsTable.visitDate} >= now() - interval '7 days'`));
  const [followUps] = await db
    .select({ c: sql<number>`cast(count(*) as int)` })
    .from(visitsTable)
    .where(w(sql`${visitsTable.followUpDate} >= current_date`));
  res.json({ today: today?.c ?? 0, week: week?.c ?? 0, upcomingFollowUps: followUps?.c ?? 0 });
});

router.get("/visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await selectVisits(eq(visitsTable.id, id));
  if (!rows.length) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(rows[0]);
});

router.post("/visits", async (req, res): Promise<void> => {
  const parsed = VisitInput.safeParse(req.body);
  const rawBranchId = (req.body as { branchId?: unknown })?.branchId;
  const branchIdVal = typeof rawBranchId === "number" && Number.isInteger(rawBranchId) && rawBranchId > 0
    ? rawBranchId
    : (rawBranchId === null ? null : undefined);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const values: any = { ...parsed.data };
  if (parsed.data.visitDate) {
    const d = new Date(parsed.data.visitDate);
    if (isNaN(d.getTime())) { res.status(400).json({ error: "Invalid visitDate" }); return; }
    values.visitDate = d;
  }
  if (branchIdVal !== undefined) values.branchId = branchIdVal;
  // followUpDate is a date column — keep as YYYY-MM-DD string
  const [visit] = await db.insert(visitsTable).values(values).returning();
  res.status(201).json(visit);
});

router.patch("/visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = VisitInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const values: any = { ...parsed.data };
  const rawB = (req.body as { branchId?: unknown })?.branchId;
  if (typeof rawB === "number" && Number.isInteger(rawB) && rawB > 0) values.branchId = rawB;
  else if (rawB === null) values.branchId = null;
  if (parsed.data.visitDate) {
    const d = new Date(parsed.data.visitDate);
    if (isNaN(d.getTime())) { res.status(400).json({ error: "Invalid visitDate" }); return; }
    values.visitDate = d;
  }
  const [visit] = await db.update(visitsTable).set(values).where(eq(visitsTable.id, id)).returning();
  if (!visit) { res.status(404).json({ error: "Visit not found" }); return; }
  res.json(visit);
});

router.delete("/visits/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [v] = await db.delete(visitsTable).where(eq(visitsTable.id, id)).returning();
  if (!v) { res.status(404).json({ error: "Visit not found" }); return; }
  res.sendStatus(204);
});

export default router;
