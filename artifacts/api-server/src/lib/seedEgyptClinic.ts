import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  EGYPT_FOODS,
  EGYPT_MATERIALS,
  EGYPT_PHYSIO_EXERCISES,
  EGYPT_PROCEDURES,
} from "./egyptClinicCatalog";

function countFromExecute(result: unknown): number {
  const rows = (result as { rows?: { c: number }[] }).rows;
  return Number(rows?.[0]?.c ?? 0);
}

export async function seedEgyptClinicCatalog(force = false): Promise<{ seeded: string[] }> {
  const seeded: string[] = [];

  const procCount = countFromExecute(
    await db.execute(sql`SELECT COUNT(*)::int AS c FROM medical_procedures`),
  );
  if (force || procCount === 0) {
    if (force) await db.execute(sql`DELETE FROM medical_procedures WHERE active = 'true'`);
    for (const p of EGYPT_PROCEDURES) {
      await db.execute(sql`
        INSERT INTO medical_procedures (name, name_ar, category, price, active)
        SELECT ${p.name}, ${p.nameAr}, ${p.category}, ${p.price}, 'true'
        WHERE NOT EXISTS (SELECT 1 FROM medical_procedures WHERE name = ${p.name} AND category = ${p.category})
      `);
    }
    seeded.push("medical_procedures");
  }

  const matCount = countFromExecute(
    await db.execute(sql`SELECT COUNT(*)::int AS c FROM medical_materials`),
  );
  if (force || matCount === 0) {
    for (const m of EGYPT_MATERIALS) {
      await db.execute(sql`
        INSERT INTO medical_materials (name, name_ar, category, unit, unit_price, sku, quantity_in_stock, reorder_level, active)
        SELECT ${m.name}, ${m.nameAr}, ${m.category}, ${m.unit}, ${m.unitPrice}, ${m.sku}, 50::float, 10::float, 1
        WHERE NOT EXISTS (SELECT 1 FROM medical_materials WHERE sku = ${m.sku})
      `);
    }
    seeded.push("medical_materials");
  }

  const exCount = countFromExecute(
    await db.execute(sql`SELECT COUNT(*)::int AS c FROM physio_exercises`),
  );
  if (force || exCount === 0) {
    for (const e of EGYPT_PHYSIO_EXERCISES) {
      await db.execute(sql`
        INSERT INTO physio_exercises (name, name_ar, category, body_region, duration_minutes, active)
        SELECT ${e.name}, ${e.nameAr}, ${e.category}, ${e.bodyRegion}, ${e.durationMinutes}, 'true'
        WHERE NOT EXISTS (SELECT 1 FROM physio_exercises WHERE name = ${e.name})
      `);
    }
    seeded.push("physio_exercises");
  }

  const foodCount = countFromExecute(
    await db.execute(sql`SELECT COUNT(*)::int AS c FROM nutrition_food_catalog`),
  );
  if (force || foodCount === 0) {
    for (const f of EGYPT_FOODS) {
      await db.execute(sql`
        INSERT INTO nutrition_food_catalog (name, name_ar, category, serving_size, calories_kcal, protein_g, carbs_g, fat_g, active)
        SELECT ${f.name}, ${f.nameAr}, ${f.category}, ${f.servingSize}, ${f.caloriesKcal}, ${f.proteinG}, ${f.carbsG}, ${f.fatG}, 'true'
        WHERE NOT EXISTS (SELECT 1 FROM nutrition_food_catalog WHERE name = ${f.name})
      `);
    }
    seeded.push("nutrition_food_catalog");
  }

  return { seeded };
}
