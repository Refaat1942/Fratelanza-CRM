import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// =============== Dental Procedures catalog ===============
export const dentalProceduresTable = pgTable("dental_procedures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  category: text("category"), // cleaning|filling|root_canal|crown|braces|whitening|extraction|implant|other
  price: real("price").notNull().default(0), // EGP
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDentalProcedureSchema = createInsertSchema(dentalProceduresTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDentalProcedure = z.infer<typeof insertDentalProcedureSchema>;
export type DentalProcedure = typeof dentalProceduresTable.$inferSelect;

// =============== Dental Chart entries ===============
// One row per (patient × tooth) — current state. History lives in dental_visits.
// Tooth numbers use FDI World Dental Federation notation: 11-18, 21-28 (upper), 31-38, 41-48 (lower).
export const dentalChartEntriesTable = pgTable("dental_chart_entries", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  toothNumber: integer("tooth_number").notNull(), // FDI: 11-18, 21-28, 31-38, 41-48
  condition: text("condition").notNull().default("healthy"), // healthy|cavity|filled|crown|root_canal|missing|extracted|implant|bridge|other
  notes: text("notes"),
  notesAr: text("notes_ar"),
  updatedByDoctorId: integer("updated_by_doctor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DentalChartEntry = typeof dentalChartEntriesTable.$inferSelect;

// =============== Dental Visits ===============
// Specialized visit log for dental work. Separate from generic medical visits so
// dentists can record tooth-specific details (tooth number, materials).
export const dentalVisitsTable = pgTable("dental_visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id"),
  visitDate: timestamp("visit_date", { withTimezone: true }).notNull().defaultNow(),
  toothNumber: integer("tooth_number"), // FDI; nullable for general dental visits
  procedureId: integer("procedure_id"), // FK to dental_procedures, optional
  treatmentType: text("treatment_type"), // free text (e.g. "Composite filling")
  treatmentTypeAr: text("treatment_type_ar"),
  materialsUsed: text("materials_used"),
  materialsUsedAr: text("materials_used_ar"),
  cost: real("cost").notNull().default(0), // EGP
  notes: text("notes"),
  notesAr: text("notes_ar"),
  followUpDate: date("follow_up_date"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DentalVisit = typeof dentalVisitsTable.$inferSelect;
