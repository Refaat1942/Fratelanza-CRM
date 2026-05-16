import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, tasksTable, clientsTable, transactionsTable, employeesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/reports/overview", async (_req, res): Promise<void> => {
  const [taskStats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      completed: sql<number>`cast(sum(case when status='completed' then 1 else 0 end) as int)`,
      pending: sql<number>`cast(sum(case when status='pending' then 1 else 0 end) as int)`,
      in_progress: sql<number>`cast(sum(case when status='in_progress' then 1 else 0 end) as int)`,
    })
    .from(tasksTable);

  const [clientStats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      active: sql<number>`cast(sum(case when status='active' then 1 else 0 end) as int)`,
      leads: sql<number>`cast(sum(case when status='lead' then 1 else 0 end) as int)`,
    })
    .from(clientsTable);

  const [finStats] = await db
    .select({
      totalIncome: sql<number>`cast(coalesce(sum(case when type='income' then amount else 0 end), 0) as numeric)`,
      totalExpenses: sql<number>`cast(coalesce(sum(case when type='expense' then amount else 0 end), 0) as numeric)`,
    })
    .from(transactionsTable);

  const [empStats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      active: sql<number>`cast(sum(case when status='active' then 1 else 0 end) as int)`,
    })
    .from(employeesTable);

  const monthlyFinance = await db
    .select({
      month: sql<string>`to_char(date::date, 'Mon YYYY')`,
      income: sql<number>`cast(coalesce(sum(case when type='income' then amount else 0 end), 0) as numeric)`,
      expenses: sql<number>`cast(coalesce(sum(case when type='expense' then amount else 0 end), 0) as numeric)`,
    })
    .from(transactionsTable)
    .groupBy(sql`to_char(date::date, 'Mon YYYY')`)
    .orderBy(sql`min(date::date)`)
    .limit(6);

  const tasksByPriority = await db
    .select({
      priority: tasksTable.priority,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(tasksTable)
    .groupBy(tasksTable.priority);

  const clientsByStatus = await db
    .select({
      status: clientsTable.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(clientsTable)
    .groupBy(clientsTable.status);

  res.json({
    tasks: taskStats,
    clients: clientStats,
    finance: {
      totalIncome: Number(finStats?.totalIncome || 0),
      totalExpenses: Number(finStats?.totalExpenses || 0),
      netBalance: Number(finStats?.totalIncome || 0) - Number(finStats?.totalExpenses || 0),
    },
    employees: empStats,
    charts: {
      monthlyFinance,
      tasksByPriority,
      clientsByStatus,
    },
  });
});

export default router;
