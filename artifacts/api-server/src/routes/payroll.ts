import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  db,
  employeesTable,
  attendanceRecordsTable,
  payrollRunsTable,
  payrollLinesTable,
} from "@workspace/db";
import { branchWhere } from "../lib/branchScope";
import { z } from "zod";

const router: IRouter = Router();

function parseSalary(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = parseFloat(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function sumHoursForEmployee(employeeId: number, periodStart: string, periodEnd: string): Promise<number> {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  const records = await db
    .select()
    .from(attendanceRecordsTable)
    .where(and(
      eq(attendanceRecordsTable.employeeId, employeeId),
      gte(attendanceRecordsTable.clockedAt, start),
      lte(attendanceRecordsTable.clockedAt, end),
    ))
    .orderBy(attendanceRecordsTable.clockedAt);

  let totalMs = 0;
  let lastIn: Date | null = null;
  for (const r of records) {
    if (r.type === "in") lastIn = r.clockedAt;
    else if (r.type === "out" && lastIn) {
      totalMs += r.clockedAt.getTime() - lastIn.getTime();
      lastIn = null;
    }
  }
  return Math.round((totalMs / 3600000) * 100) / 100;
}

router.get("/payroll/runs", async (req, res): Promise<void> => {
  const bw = branchWhere(req, payrollRunsTable.branchId);
  const q = db.select().from(payrollRunsTable).$dynamic();
  const rows = bw
    ? await q.where(bw).orderBy(desc(payrollRunsTable.createdAt))
    : await q.orderBy(desc(payrollRunsTable.createdAt));
  res.json(rows);
});

router.get("/payroll/runs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [run] = await db.select().from(payrollRunsTable).where(eq(payrollRunsTable.id, id));
  if (!run) { res.status(404).json({ error: "Not found" }); return; }

  const lines = await db
    .select({
      id: payrollLinesTable.id,
      employeeId: payrollLinesTable.employeeId,
      baseSalary: payrollLinesTable.baseSalary,
      hoursWorked: payrollLinesTable.hoursWorked,
      overtimeHours: payrollLinesTable.overtimeHours,
      overtimePay: payrollLinesTable.overtimePay,
      deductions: payrollLinesTable.deductions,
      netAmount: payrollLinesTable.netAmount,
      notes: payrollLinesTable.notes,
      employeeName: employeesTable.name,
      employeeNameAr: employeesTable.nameAr,
    })
    .from(payrollLinesTable)
    .leftJoin(employeesTable, eq(employeesTable.id, payrollLinesTable.employeeId))
    .where(eq(payrollLinesTable.payrollRunId, id));

  res.json({ run, lines });
});

const CreateRunInput = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  notes: z.string().optional(),
  notesAr: z.string().optional(),
  branchId: z.number().int().positive().nullable().optional(),
});

router.post("/payroll/runs", async (req, res): Promise<void> => {
  const parsed = CreateRunInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const bw = branchWhere(req, employeesTable.branchId);
  const empQ = db.select().from(employeesTable).where(eq(employeesTable.status, "active")).$dynamic();
  const employees = bw ? await empQ.where(bw) : await empQ;

  const [run] = await db.insert(payrollRunsTable).values({
    periodStart: parsed.data.periodStart,
    periodEnd: parsed.data.periodEnd,
    notes: parsed.data.notes,
    notesAr: parsed.data.notesAr,
    branchId: parsed.data.branchId ?? null,
    status: "draft",
    totalAmount: 0,
  }).returning();

  let total = 0;
  const lines = [];
  for (const emp of employees) {
    const hoursWorked = await sumHoursForEmployee(emp.id, parsed.data.periodStart, parsed.data.periodEnd);
    const baseSalary = parseSalary(emp.salary);
    const hourlyRate = parseSalary(emp.hourlyRate);
    const payType = emp.payType ?? "monthly";

    let net = baseSalary;
    let overtimeHours = 0;
    let overtimePay = 0;

    if (payType === "hourly") {
      const standardHours = 160;
      overtimeHours = Math.max(0, hoursWorked - standardHours);
      const regularHours = Math.min(hoursWorked, standardHours);
      net = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5;
      overtimePay = overtimeHours * hourlyRate * 1.5;
    } else if (hoursWorked > 160) {
      overtimeHours = hoursWorked - 160;
      overtimePay = overtimeHours * (hourlyRate || baseSalary / 160) * 1.5;
      net = baseSalary + overtimePay;
    }

    const [line] = await db.insert(payrollLinesTable).values({
      payrollRunId: run!.id,
      employeeId: emp.id,
      baseSalary: payType === "hourly" ? 0 : baseSalary,
      hoursWorked,
      overtimeHours,
      overtimePay,
      deductions: 0,
      netAmount: Math.round(net * 100) / 100,
    }).returning();
    total += line!.netAmount;
    lines.push(line);
  }

  const [updated] = await db
    .update(payrollRunsTable)
    .set({ totalAmount: Math.round(total * 100) / 100 })
    .where(eq(payrollRunsTable.id, run!.id))
    .returning();

  res.status(201).json({ run: updated, lines });
});

router.patch("/payroll/runs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const status = typeof req.body?.status === "string" ? req.body.status : undefined;
  if (!status) { res.status(400).json({ error: "status required" }); return; }

  const [run] = await db
    .update(payrollRunsTable)
    .set({ status })
    .where(eq(payrollRunsTable.id, id))
    .returning();
  if (!run) { res.status(404).json({ error: "Not found" }); return; }
  res.json(run);
});

router.get("/payroll/stats", async (_req, res): Promise<void> => {
  const [drafts] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(payrollRunsTable)
    .where(eq(payrollRunsTable.status, "draft"));
  const [paid] = await db
    .select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
    .from(payrollRunsTable)
    .where(eq(payrollRunsTable.status, "paid"));
  res.json({ draftRuns: drafts?.count ?? 0, paidTotal: paid?.total ?? 0 });
});

export default router;
