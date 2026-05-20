import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// =============== Treatment Plans ===============
// A treatment plan is a multi-visit roadmap for a patient (e.g. full mouth rehab,
// braces course, multi-step root canal). Each plan has line items that are
// "planned" → "scheduled" → "done" / "cancelled". Cost estimate is the sum of
// item totals. Plans live alongside Medical Invoices: a plan does NOT auto-bill;
// the user creates an invoice from completed items when ready.

export const treatmentPlansTable = pgTable("treatment_plans", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id"), // FK to employees, nullable
  title: text("title"),
  titleAr: text("title_ar"),
  status: text("status").notNull().default("draft"), // draft | active | completed | cancelled
  notes: text("notes"),
  notesAr: text("notes_ar"),
  estimatedTotal: real("estimated_total").notNull().default(0),
  startDate: date("start_date"),
  targetCompletionDate: date("target_completion_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTreatmentPlanSchema = createInsertSchema(treatmentPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTreatmentPlan = z.infer<typeof insertTreatmentPlanSchema>;
export type TreatmentPlan = typeof treatmentPlansTable.$inferSelect;

// =============== Treatment Plan Items ===============
export const treatmentPlanItemsTable = pgTable("treatment_plan_items", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull(), // CASCADE on delete (enforced in SQL)
  procedureId: integer("procedure_id"), // FK to medical_procedures (or dental_procedures), nullable for custom
  description: text("description"),
  descriptionAr: text("description_ar"),
  toothNumber: integer("tooth_number"), // optional, FDI
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  total: real("total").notNull().default(0),
  status: text("status").notNull().default("planned"), // planned | scheduled | done | cancelled
  scheduledDate: date("scheduled_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedVisitId: integer("completed_visit_id"), // FK to visits, nullable
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTreatmentPlanItemSchema = createInsertSchema(treatmentPlanItemsTable).omit({ id: true, createdAt: true });
export type InsertTreatmentPlanItem = z.infer<typeof insertTreatmentPlanItemSchema>;
export type TreatmentPlanItem = typeof treatmentPlanItemsTable.$inferSelect;
