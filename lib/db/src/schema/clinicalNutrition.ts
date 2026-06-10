import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nutritionFoodCatalogTable = pgTable("nutrition_food_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  category: text("category"), // grains, proteins, dairy, vegetables, fruits, egyptian_dishes
  servingSize: text("serving_size"),
  caloriesKcal: real("calories_kcal"),
  proteinG: real("protein_g"),
  carbsG: real("carbs_g"),
  fatG: real("fat_g"),
  fiberG: real("fiber_g"),
  notes: text("notes"),
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nutritionAssessmentsTable = pgTable("nutrition_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  dietitianId: integer("dietitian_id"),
  assessmentDate: date("assessment_date").notNull(),
  weightKg: real("weight_kg"),
  heightCm: real("height_cm"),
  bmi: real("bmi"),
  waistCm: real("waist_cm"),
  activityLevel: text("activity_level"), // sedentary|light|moderate|active|athlete
  medicalConditions: text("medical_conditions"), // diabetes, hypertension, obesity, etc.
  medicalConditionsAr: text("medical_conditions_ar"),
  allergies: text("allergies"),
  dietaryRestrictions: text("dietary_restrictions"), // halal, vegetarian, low_sodium, etc.
  goals: text("goals"),
  goalsAr: text("goals_ar"),
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const nutritionMealPlansTable = pgTable("nutrition_meal_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  assessmentId: integer("assessment_id"),
  dietitianId: integer("dietitian_id"),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  dailyCaloriesTarget: real("daily_calories_target"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"), // active|completed|paused
  notes: text("notes"),
  notesAr: text("notes_ar"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const nutritionMealPlanItemsTable = pgTable("nutrition_meal_plan_items", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").notNull(),
  mealType: text("meal_type").notNull(), // breakfast|snack|lunch|dinner
  foodName: text("food_name").notNull(),
  foodNameAr: text("food_name_ar"),
  portion: text("portion"),
  caloriesKcal: real("calories_kcal"),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nutritionConsultationsTable = pgTable("nutrition_consultations", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  mealPlanId: integer("meal_plan_id"),
  dietitianId: integer("dietitian_id"),
  consultationDate: timestamp("consultation_date", { withTimezone: true }).notNull(),
  weightKg: real("weight_kg"),
  adherenceScore: integer("adherence_score"), // 1-10
  summary: text("summary"),
  summaryAr: text("summary_ar"),
  recommendations: text("recommendations"),
  recommendationsAr: text("recommendations_ar"),
  feeEgp: real("fee_egp").default(0),
  status: text("status").notNull().default("completed"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNutritionAssessmentSchema = createInsertSchema(nutritionAssessmentsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type NutritionAssessment = typeof nutritionAssessmentsTable.$inferSelect;
export type NutritionMealPlan = typeof nutritionMealPlansTable.$inferSelect;
export type NutritionConsultation = typeof nutritionConsultationsTable.$inferSelect;
export type NutritionFoodCatalog = typeof nutritionFoodCatalogTable.$inferSelect;
