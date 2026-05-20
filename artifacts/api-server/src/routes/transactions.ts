import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, transactionsTable, activityTable } from "@workspace/db";
import { branchWhere } from "../lib/branchScope";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  DeleteTransactionParams,
  GetFinancialSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions/summary", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      type: transactionsTable.type,
      category: transactionsTable.category,
      total: sql<number>`cast(sum(amount) as float)`,
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.type, transactionsTable.category);

  let totalIncome = 0;
  let totalExpenses = 0;
  const byCategory: { category: string; total: number; type: "income" | "expense" }[] = [];

  for (const row of rows) {
    if (row.type === "income") totalIncome += row.total;
    else totalExpenses += row.total;
    byCategory.push({ category: row.category, total: row.total, type: row.type as "income" | "expense" });
  }

  res.json(GetFinancialSummaryResponse.parse({
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    byCategory,
  }));
});

router.get("/transactions", async (req, res): Promise<void> => {
  const params = ListTransactionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conds: any[] = [];
  if (params.data.type) conds.push(eq(transactionsTable.type, params.data.type));
  if (params.data.category) conds.push(eq(transactionsTable.category, params.data.category));
  const bw = branchWhere(req, transactionsTable.branchId);
  if (bw) conds.push(bw);
  let query = db.select().from(transactionsTable).$dynamic();
  if (conds.length) query = query.where(conds.length === 1 ? conds[0] : and(...conds));

  const transactions = await query.orderBy(transactionsTable.createdAt);
  res.json(ListTransactionsResponse.parse(transactions));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date, ...txRest } = parsed.data;
  const rawBranchId = (req.body as { branchId?: unknown })?.branchId;
  const branchId =
    typeof rawBranchId === "number" && Number.isInteger(rawBranchId) && rawBranchId > 0
      ? rawBranchId
      : null;
  const [transaction] = await db.insert(transactionsTable).values({
    ...txRest,
    date: date.toISOString().slice(0, 10),
    branchId,
  }).returning();

  await db.insert(activityTable).values({
    type: "transaction_recorded",
    description: `Transaction recorded: ${transaction.title} (${transaction.type === "income" ? "+" : "-"}${transaction.amount})`,
    descriptionAr: transaction.titleAr
      ? `تم تسجيل معاملة: ${transaction.titleAr} (${transaction.type === "income" ? "+" : "-"}${transaction.amount})`
      : null,
  });

  res.status(201).json(GetTransactionResponse.parse(transaction));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse(transaction));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { date: updateDate, ...updateTxRest } = parsed.data;
  const [transaction] = await db
    .update(transactionsTable)
    .set({
      ...updateTxRest,
      ...(updateDate !== undefined
        ? { date: updateDate.toISOString().slice(0, 10) }
        : {}),
    })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(UpdateTransactionResponse.parse(transaction));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db.delete(transactionsTable).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
