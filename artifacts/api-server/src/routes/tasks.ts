import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, tasksTable, activityTable, notificationsTable } from "@workspace/db";
import {
  ListTasksQueryParams,
  ListTasksResponse,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  GetTaskStatsResponse,
} from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

const RECURRENCE = z.enum(["none", "daily", "weekly", "monthly"]).default("none");

router.get("/tasks/stats", async (req, res): Promise<void> => {
  const rows = await db
    .select({ status: tasksTable.status, count: sql<number>`cast(count(*) as int)` })
    .from(tasksTable).groupBy(tasksTable.status);
  const stats = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
  for (const row of rows) {
    if (row.status in stats) stats[row.status as keyof typeof stats] = row.count;
  }
  res.json(GetTaskStatsResponse.parse(stats));
});

router.get("/tasks", async (req, res): Promise<void> => {
  const params = ListTasksQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  let query = db.select().from(tasksTable).$dynamic();
  if (params.data.status) query = query.where(eq(tasksTable.status, params.data.status));
  if (params.data.priority) query = query.where(eq(tasksTable.priority, params.data.priority));
  const tasks = await query.orderBy(tasksTable.createdAt);
  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const recurrence = RECURRENCE.parse(req.body.recurrence ?? "none");
  const { dueDate, ...rest } = parsed.data;
  const [task] = await db.insert(tasksTable).values({
    ...rest,
    recurrence,
    ...(dueDate ? { dueDate: dueDate.toISOString().slice(0, 10) } : {}),
  }).returning();

  await db.insert(activityTable).values({
    type: "task_created",
    description: `Task created: ${task.title}`,
    descriptionAr: task.titleAr ? `تم إنشاء مهمة: ${task.titleAr}` : null,
  });

  if (task.assignee) {
    await db.insert(notificationsTable).values({
      title: `New Task Assigned: ${task.title}`,
      titleAr: task.titleAr ? `مهمة جديدة مُسندة: ${task.titleAr}` : null,
      message: `Task assigned to ${task.assignee}${task.dueDate ? ` — Due: ${task.dueDate}` : ""}`,
      messageAr: `تم إسناد المهمة إلى ${task.assignee}${task.dueDate ? ` — الاستحقاق: ${task.dueDate}` : ""}`,
      type: "info",
      isRead: false,
    });
  }

  res.status(201).json(GetTaskResponse.parse(task));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const recurrenceRaw = req.body.recurrence;
  const recurrenceUpdate = recurrenceRaw ? RECURRENCE.parse(recurrenceRaw) : undefined;

  const [oldTask] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  const { dueDate: updateDueDate, ...updateRest } = parsed.data;
  const [task] = await db.update(tasksTable).set({
    ...updateRest,
    ...(recurrenceUpdate ? { recurrence: recurrenceUpdate } : {}),
    ...(updateDueDate !== undefined ? { dueDate: updateDueDate ? updateDueDate.toISOString().slice(0, 10) : null } : {}),
  }).where(eq(tasksTable.id, params.data.id)).returning();

  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  if (parsed.data.status === "completed") {
    await db.insert(activityTable).values({
      type: "task_completed",
      description: `Task completed: ${task.title}`,
      descriptionAr: task.titleAr ? `تم إنجاز مهمة: ${task.titleAr}` : null,
    });
  }

  const assigneeChanged = updateRest.assignee && updateRest.assignee !== oldTask?.assignee;
  if (assigneeChanged && task.assignee) {
    await db.insert(notificationsTable).values({
      title: `Task Assigned: ${task.title}`,
      titleAr: task.titleAr ? `مهمة مُسندة: ${task.titleAr}` : null,
      message: `Task assigned to ${task.assignee}${task.dueDate ? ` — Due: ${task.dueDate}` : ""}`,
      messageAr: `تم إسناد المهمة إلى ${task.assignee}${task.dueDate ? ` — الاستحقاق: ${task.dueDate}` : ""}`,
      type: "info",
      isRead: false,
    });
  }

  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.sendStatus(204);
});

export default router;
