import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, medicalSpecializationCatalogTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/medical-specialization-catalog", async (req: Request, res: Response): Promise<void> => {
  const type = typeof req.query.type === "string" ? req.query.type.trim() : "";
  const specialization = typeof req.query.specialization === "string" ? req.query.specialization.trim() : "";
  const conditions = [eq(medicalSpecializationCatalogTable.active, 1)];
  if (type) conditions.push(eq(medicalSpecializationCatalogTable.type, type));
  if (specialization) conditions.push(eq(medicalSpecializationCatalogTable.specialization, specialization));
  const rows = await db
    .select()
    .from(medicalSpecializationCatalogTable)
    .where(and(...conditions))
    .orderBy(asc(medicalSpecializationCatalogTable.type), asc(medicalSpecializationCatalogTable.name));
  res.json(rows);
});

export default router;
