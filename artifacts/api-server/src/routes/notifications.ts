import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const NotificationInput = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  message: z.string().optional(),
  messageAr: z.string().optional(),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  isRead: z.boolean().default(false),
});

router.get("/notifications", async (_req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)).limit(50);
  res.json(notifications);
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = NotificationInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [notif] = await db.insert(notificationsTable).values(parsed.data).returning();
  res.status(201).json(notif);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [notif] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id)).returning();
  if (!notif) { res.status(404).json({ error: "Not found" }); return; }
  res.json(notif);
});

router.patch("/notifications/read-all", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true });
  res.json({ ok: true });
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.status(204).send();
});

export default router;
