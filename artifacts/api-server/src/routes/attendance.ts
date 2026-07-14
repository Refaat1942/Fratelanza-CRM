import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, attendanceRecordsTable, employeesTable, getCurrentTenant, isFeatureEnabled } from "@workspace/db";
import { branchWhere } from "../lib/branchScope";
import { z } from "zod";
import crypto from "node:crypto";

const router: IRouter = Router();

function newClockToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

async function getLastRecord(employeeId: number) {
  const [row] = await db
    .select()
    .from(attendanceRecordsTable)
    .where(eq(attendanceRecordsTable.employeeId, employeeId))
    .orderBy(desc(attendanceRecordsTable.clockedAt))
    .limit(1);
  return row ?? null;
}

async function clockEmployee(
  employeeId: number,
  branchId: number | null,
  method: string,
  forceType?: "in" | "out",
) {
  const last = await getLastRecord(employeeId);
  const type = forceType ?? (last?.type === "in" ? "out" : "in");
  const [record] = await db
    .insert(attendanceRecordsTable)
    .values({ employeeId, branchId, type, method })
    .returning();
  return { record, type };
}

router.get("/attendance", async (req, res): Promise<void> => {
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  const bw = branchWhere(req, attendanceRecordsTable.branchId);
  const parts = [];
  if (from) parts.push(gte(attendanceRecordsTable.clockedAt, new Date(from)));
  if (to) parts.push(lte(attendanceRecordsTable.clockedAt, new Date(to)));
  if (bw) parts.push(bw);

  let q = db
    .select({
      id: attendanceRecordsTable.id,
      employeeId: attendanceRecordsTable.employeeId,
      branchId: attendanceRecordsTable.branchId,
      type: attendanceRecordsTable.type,
      clockedAt: attendanceRecordsTable.clockedAt,
      method: attendanceRecordsTable.method,
      notes: attendanceRecordsTable.notes,
      employeeName: employeesTable.name,
      employeeNameAr: employeesTable.nameAr,
      department: employeesTable.department,
    })
    .from(attendanceRecordsTable)
    .leftJoin(employeesTable, eq(employeesTable.id, attendanceRecordsTable.employeeId))
    .$dynamic();

  if (parts.length) q = q.where(and(...parts));
  const rows = await q.orderBy(desc(attendanceRecordsTable.clockedAt)).limit(500);
  res.json(rows);
});

router.get("/attendance/today", async (req, res): Promise<void> => {
  const bw = branchWhere(req, attendanceRecordsTable.branchId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const parts = [gte(attendanceRecordsTable.clockedAt, start)];
  if (bw) parts.push(bw);

  const rows = await db
    .select({
      id: attendanceRecordsTable.id,
      employeeId: attendanceRecordsTable.employeeId,
      type: attendanceRecordsTable.type,
      clockedAt: attendanceRecordsTable.clockedAt,
      method: attendanceRecordsTable.method,
      employeeName: employeesTable.name,
      employeeNameAr: employeesTable.nameAr,
      department: employeesTable.department,
    })
    .from(attendanceRecordsTable)
    .leftJoin(employeesTable, eq(employeesTable.id, attendanceRecordsTable.employeeId))
    .where(and(...parts))
    .orderBy(desc(attendanceRecordsTable.clockedAt));

  const activeIds = new Set<number>();
  for (const r of [...rows].reverse()) {
    if (r.type === "in") activeIds.add(r.employeeId);
    else activeIds.delete(r.employeeId);
  }

  res.json({
    records: rows,
    stats: {
      punchesToday: rows.length,
      currentlyIn: activeIds.size,
    },
  });
});

router.get("/attendance/stats", async (req, res): Promise<void> => {
  const bw = branchWhere(req, attendanceRecordsTable.branchId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const parts = [gte(attendanceRecordsTable.clockedAt, start)];
  if (bw) parts.push(bw);

  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(attendanceRecordsTable)
    .where(and(...parts));

  res.json({ punchesToday: row?.count ?? 0 });
});

const ManualClockInput = z.object({
  employeeId: z.number().int().positive(),
  type: z.enum(["in", "out"]).optional(),
  notes: z.string().optional(),
});

router.post("/attendance/clock", async (req, res): Promise<void> => {
  const parsed = ManualClockInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, parsed.data.employeeId));
  if (!emp) { res.status(404).json({ error: "employee_not_found" }); return; }
  if (emp.status !== "active") { res.status(400).json({ error: "employee_inactive" }); return; }

  const branchId = (emp as { branchId?: number | null }).branchId ?? null;
  const result = await clockEmployee(parsed.data.employeeId, branchId, "manual", parsed.data.type);
  res.status(201).json(result);
});

router.post("/employees/:id/regenerate-clock-token", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const token = newClockToken();
  const [emp] = await db
    .update(employeesTable)
    .set({ clockToken: token })
    .where(eq(employeesTable.id, id))
    .returning();
  if (!emp) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ clockToken: emp.clockToken });
});

export default router;

/** Public clock endpoint — no auth, QR scan at kiosk. */
export const publicClockRouter: IRouter = Router();

publicClockRouter.post("/public/clock/:token", async (req, res): Promise<void> => {
  const tenant = getCurrentTenant();
  if (tenant && !isFeatureEnabled(tenant.features, "hr_attendance")) {
    res.status(403).json({ error: "feature_disabled", feature: "hr_attendance" });
    return;
  }

  const token = String(req.params.token || "").trim();
  if (!token || token.length < 16) {
    res.status(400).json({ error: "invalid_token" });
    return;
  }

  const [emp] = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      nameAr: employeesTable.nameAr,
      department: employeesTable.department,
      departmentAr: employeesTable.departmentAr,
      branchId: employeesTable.branchId,
      status: employeesTable.status,
    })
    .from(employeesTable)
    .where(eq(employeesTable.clockToken, token));

  if (!emp) {
    res.status(404).json({ error: "employee_not_found" });
    return;
  }
  if (emp.status !== "active") {
    res.status(400).json({ error: "employee_inactive" });
    return;
  }

  const result = await clockEmployee(emp.id, emp.branchId ?? null, "qr");
  res.json({
    type: result.type,
    clockedAt: result.record.clockedAt,
    employee: {
      id: emp.id,
      name: emp.name,
      nameAr: emp.nameAr,
      department: emp.department,
      departmentAr: emp.departmentAr,
    },
  });
});

publicClockRouter.get("/public/clock/:token/info", async (req, res): Promise<void> => {
  const tenant = getCurrentTenant();
  if (tenant && !isFeatureEnabled(tenant.features, "hr_attendance")) {
    res.status(403).json({ error: "feature_disabled" });
    return;
  }

  const token = String(req.params.token || "").trim();
  const [emp] = await db
    .select({
      id: employeesTable.id,
      name: employeesTable.name,
      nameAr: employeesTable.nameAr,
      department: employeesTable.department,
      departmentAr: employeesTable.departmentAr,
      status: employeesTable.status,
    })
    .from(employeesTable)
    .where(eq(employeesTable.clockToken, token));

  if (!emp) { res.status(404).json({ error: "employee_not_found" }); return; }

  const last = await getLastRecord(emp.id);
  res.json({
    employee: emp,
    lastType: last?.type ?? null,
    lastClockedAt: last?.clockedAt ?? null,
    nextType: last?.type === "in" ? "out" : "in",
  });
});
