import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, tasksTable, clientsTable, transactionsTable, activityTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [taskStats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      completed: sql<number>`cast(sum(case when status = 'completed' then 1 else 0 end) as int)`,
      pending: sql<number>`cast(sum(case when status = 'pending' then 1 else 0 end) as int)`,
    })
    .from(tasksTable);

  const [clientStats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      active: sql<number>`cast(sum(case when status = 'active' then 1 else 0 end) as int)`,
    })
    .from(clientsTable);

  const [finStats] = await db
    .select({
      revenue: sql<number>`cast(coalesce(sum(case when type = 'income' then amount else 0 end), 0) as float)`,
      expenses: sql<number>`cast(coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as float)`,
    })
    .from(transactionsTable);

  res.json(GetDashboardSummaryResponse.parse({
    totalClients: clientStats?.total ?? 0,
    activeClients: clientStats?.active ?? 0,
    totalTasks: taskStats?.total ?? 0,
    completedTasks: taskStats?.completed ?? 0,
    pendingTasks: taskStats?.pending ?? 0,
    totalRevenue: finStats?.revenue ?? 0,
    totalExpenses: finStats?.expenses ?? 0,
    netBalance: (finStats?.revenue ?? 0) - (finStats?.expenses ?? 0),
  }));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  res.json(GetRecentActivityResponse.parse(activities));
});

export default router;
