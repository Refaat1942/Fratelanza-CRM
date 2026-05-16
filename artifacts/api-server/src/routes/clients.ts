import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, clientsTable, activityTable } from "@workspace/db";
import {
  ListClientsQueryParams,
  ListClientsResponse,
  CreateClientBody,
  GetClientParams,
  GetClientResponse,
  UpdateClientParams,
  UpdateClientBody,
  UpdateClientResponse,
  DeleteClientParams,
  GetClientStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/clients/stats", async (req, res): Promise<void> => {
  const rows = await db
    .select({ status: clientsTable.status, count: sql<number>`cast(count(*) as int)` })
    .from(clientsTable)
    .groupBy(clientsTable.status);

  const stats = { active: 0, inactive: 0, lead: 0, prospect: 0 };
  for (const row of rows) {
    if (row.status in stats) stats[row.status as keyof typeof stats] = row.count;
  }

  res.json(GetClientStatsResponse.parse(stats));
});

router.get("/clients", async (req, res): Promise<void> => {
  const params = ListClientsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(clientsTable).$dynamic();
  if (params.data.status) {
    query = query.where(eq(clientsTable.status, params.data.status));
  }
  if (params.data.search) {
    query = query.where(ilike(clientsTable.name, `%${params.data.search}%`));
  }

  const clients = await query.orderBy(clientsTable.createdAt);
  res.json(ListClientsResponse.parse(clients));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db.insert(clientsTable).values(parsed.data).returning();

  await db.insert(activityTable).values({
    type: "client_added",
    description: `Client added: ${client.name}`,
    descriptionAr: client.nameAr ? `تمت إضافة عميل: ${client.nameAr}` : null,
  });

  res.status(201).json(GetClientResponse.parse(client));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(GetClientResponse.parse(client));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .update(clientsTable)
    .set(parsed.data)
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(UpdateClientResponse.parse(client));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
