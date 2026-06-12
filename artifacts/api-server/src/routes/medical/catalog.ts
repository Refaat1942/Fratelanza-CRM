import { Router, type IRouter } from "express";
import {
  EGYPT_ALLERGIES,
  EGYPT_CHRONIC_CONDITIONS,
  EGYPT_CITIES_BY_GOVERNORATE,
  EGYPT_DIAGNOSES,
  EGYPT_INSURANCE_PROVIDERS,
  EGYPT_MEDICATIONS,
  EGYPT_PHYSIO_MODALITIES,
  PROCEDURE_CATEGORIES_EGYPT,
} from "../../lib/egyptClinicCatalog";
import { medicationCatalogItems } from "../../lib/medicationProducts";
import { seedEgyptClinicCatalog } from "../../lib/seedEgyptClinic";
import { EGYPT_GOVERNORATES, INSURANCE_TYPES } from "../../lib/egyptGovernoratesData";

const router: IRouter = Router();

/** Static Egyptian market options for forms (bilingual) + tenant medicine products. */
router.get("/medical/catalog/options", async (_req, res): Promise<void> => {
  const importedMeds = await medicationCatalogItems();
  const staticMeds = EGYPT_MEDICATIONS.map((m) => ({ ...m, value: m.value ?? m.en }));
  const seen = new Set(staticMeds.map((m) => m.en.toLowerCase()));
  const medications = [
    ...importedMeds,
    ...staticMeds.filter((m) => !seen.has(m.en.toLowerCase())),
  ];
  res.json({
    governorates: EGYPT_GOVERNORATES,
    insuranceTypes: INSURANCE_TYPES,
    insuranceProviders: EGYPT_INSURANCE_PROVIDERS,
    citiesByGovernorate: EGYPT_CITIES_BY_GOVERNORATE,
    procedureCategories: PROCEDURE_CATEGORIES_EGYPT,
    diagnoses: EGYPT_DIAGNOSES,
    chronicConditions: EGYPT_CHRONIC_CONDITIONS,
    allergies: EGYPT_ALLERGIES,
    medications,
    physioModalities: EGYPT_PHYSIO_MODALITIES,
    maritalStatuses: [
      { en: "Single", ar: "أعزب / عزباء", value: "single" },
      { en: "Married", ar: "متزوج / متزوجة", value: "married" },
      { en: "Divorced", ar: "مطلق / مطلقة", value: "divorced" },
      { en: "Widowed", ar: "أرمل / أرملة", value: "widowed" },
    ],
    bloodTypes: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    activityLevels: [
      { en: "Sedentary", ar: "قليل الحركة", value: "sedentary" },
      { en: "Light", ar: "نشاط خفيف", value: "light" },
      { en: "Moderate", ar: "متوسط", value: "moderate" },
      { en: "Active", ar: "نشط", value: "active" },
      { en: "Athlete", ar: "رياضي", value: "athlete" },
    ],
    dietaryRestrictions: [
      { en: "Halal", ar: "حلال" },
      { en: "Low sodium", ar: "قليل الملح" },
      { en: "Diabetic diet", ar: "نظام سكري" },
      { en: "Low carb", ar: "قليل الكربوهيدرات" },
      { en: "Gluten free", ar: "خالي من الجلوتين" },
    ],
  });
});

/** Seed procedures, materials, physio exercises, food catalog (idempotent). */
router.post("/medical/catalog/seed-egypt", async (req, res): Promise<void> => {
  const force = req.query.force === "1" || req.body?.force === true;
  try {
    const result = await seedEgyptClinicCatalog(force);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "seed_failed" });
  }
});

export default router;
