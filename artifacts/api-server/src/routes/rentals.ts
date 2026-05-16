import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, rentalsTable } from "@workspace/db";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const RentalInput = z.object({
  clientId: z.coerce.number().optional(),
  clientName: z.string().optional(),
  employeeId: z.coerce.number().optional(),
  employeeName: z.string().optional(),
  productId: z.coerce.number().optional(),
  productName: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  returnDate: z.string().optional(),
  dailyRate: z.coerce.number().optional(),
  totalAmount: z.coerce.number().optional(),
  depositAmount: z.coerce.number().optional(),
  status: z.enum(["new", "confirmed", "active", "returned", "cancelled"]).default("new"),
  notes: z.string().optional(),
});

router.get("/rentals/stats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(rentalsTable);
  const stats = { new: 0, confirmed: 0, active: 0, returned: 0, cancelled: 0, total: rows.length };
  for (const r of rows) { if (r.status in stats) stats[r.status as keyof typeof stats] = (stats[r.status as keyof typeof stats] as number) + 1; }
  res.json(stats);
});

router.get("/rentals", async (_req, res): Promise<void> => {
  const rentals = await db.select().from(rentalsTable).orderBy(desc(rentalsTable.createdAt));
  res.json(rentals);
});

router.post("/rentals", upload.single("document"), async (req, res): Promise<void> => {
  const parsed = RentalInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: any = { ...parsed.data };
  if (req.file) { data.documentPath = req.file.path; data.documentName = req.file.originalname; }
  const [rental] = await db.insert(rentalsTable).values(data).returning();
  res.status(201).json(rental);
});

router.get("/rentals/:id", async (req, res): Promise<void> => {
  const [r] = await db.select().from(rentalsTable).where(eq(rentalsTable.id, parseInt(req.params.id)));
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(r);
});

router.patch("/rentals/:id", upload.single("document"), async (req, res): Promise<void> => {
  const parsed = RentalInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data: any = { ...parsed.data };
  if (req.file) { data.documentPath = req.file.path; data.documentName = req.file.originalname; }
  const [r] = await db.update(rentalsTable).set(data).where(eq(rentalsTable.id, parseInt(req.params.id))).returning();
  if (!r) { res.status(404).json({ error: "Not found" }); return; }
  res.json(r);
});

router.delete("/rentals/:id", async (req, res): Promise<void> => {
  await db.delete(rentalsTable).where(eq(rentalsTable.id, parseInt(req.params.id)));
  res.status(204).send();
});

export default router;
