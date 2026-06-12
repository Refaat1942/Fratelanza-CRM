import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

/** Categories that mark a product as a prescribable medicine. */
export const MEDICATION_CATEGORIES = [
  "medication",
  "medicine",
  "medicines",
  "pharmaceutical",
  "pharmacy",
  "drug",
  "دواء",
  "أدوية",
] as const;

export function isMedicationCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  const c = category.trim().toLowerCase();
  return MEDICATION_CATEGORIES.some((x) => x.toLowerCase() === c)
    || c.includes("medic")
    || c.includes("pharm")
    || c.includes("دواء");
}

export function medicationCategoryWhere() {
  return or(
    inArray(productsTable.category, [...MEDICATION_CATEGORIES]),
    sql`lower(${productsTable.category}) LIKE '%medic%'`,
    sql`lower(${productsTable.category}) LIKE '%pharm%'`,
    sql`${productsTable.category} LIKE '%دواء%'`,
  );
}

export async function listMedicationProducts() {
  return db.select().from(productsTable).where(medicationCategoryWhere()!).orderBy(productsTable.name);
}

export async function clearMedicationProducts(): Promise<number> {
  const rows = await db.delete(productsTable).where(medicationCategoryWhere()!).returning({ id: productsTable.id });
  return rows.length;
}

export type MedicationCatalogItem = { en: string; ar: string; value?: string; productId?: number };

export async function medicationCatalogItems(): Promise<MedicationCatalogItem[]> {
  const rows = await listMedicationProducts();
  return rows.map((p) => ({
    en: p.name,
    ar: p.nameAr ?? p.name,
    value: `product:${p.id}`,
    productId: p.id,
  }));
}
