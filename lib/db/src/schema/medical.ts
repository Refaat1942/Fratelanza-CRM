import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// =============== Patients ===============
export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  firstNameAr: text("first_name_ar"),
  lastName: text("last_name"),
  lastNameAr: text("last_name_ar"),
  gender: text("gender"), // 'male' | 'female' | 'other'
  dateOfBirth: date("date_of_birth"),
  nationalId: text("national_id"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  addressAr: text("address_ar"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;

// =============== Medical Appointments ===============
export const medicalAppointmentsTable = pgTable("medical_appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id"), // FK to employees
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  status: text("status").notNull().default("scheduled"), // scheduled|confirmed|completed|no_show|cancelled
  reason: text("reason"),
  reasonAr: text("reason_ar"),
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type MedicalAppointment = typeof medicalAppointmentsTable.$inferSelect;

// =============== Visits ===============
export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  appointmentId: integer("appointment_id"),
  doctorId: integer("doctor_id"),
  visitDate: timestamp("visit_date", { withTimezone: true }).notNull().defaultNow(),
  chiefComplaint: text("chief_complaint"),
  chiefComplaintAr: text("chief_complaint_ar"),
  diagnosis: text("diagnosis"),
  diagnosisAr: text("diagnosis_ar"),
  treatment: text("treatment"),
  treatmentAr: text("treatment_ar"),
  followUpDate: date("follow_up_date"),
  notes: text("notes"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Visit = typeof visitsTable.$inferSelect;

// =============== Procedures catalog ===============
export const medicalProceduresTable = pgTable("medical_procedures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  category: text("category"), // e.g. "general" | "dental" | etc.
  price: real("price").notNull().default(0), // EGP
  active: text("active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type MedicalProcedure = typeof medicalProceduresTable.$inferSelect;

// =============== Prescriptions ===============
export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  medicineNameAr: text("medicine_name_ar"),
  dosage: text("dosage"),
  frequency: text("frequency"),
  durationDays: integer("duration_days"),
  instructions: text("instructions"),
  instructionsAr: text("instructions_ar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Prescription = typeof prescriptionsTable.$inferSelect;

// =============== Medical Invoices ===============
export const medicalInvoicesTable = pgTable("medical_invoices", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  visitId: integer("visit_id"),
  doctorId: integer("doctor_id"),
  invoiceDate: date("invoice_date").notNull(),
  total: real("total").notNull().default(0), // EGP
  paidAmount: real("paid_amount").notNull().default(0), // EGP
  status: text("status").notNull().default("unpaid"), // unpaid|partial|paid|cancelled
  paymentMethod: text("payment_method"), // cash|card|transfer|other
  transactionId: integer("transaction_id"), // link to transactions when paid
  notes: text("notes"),
  notesAr: text("notes_ar"),
  branchId: integer("branch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type MedicalInvoice = typeof medicalInvoicesTable.$inferSelect;

export const medicalInvoiceLinesTable = pgTable("medical_invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  procedureId: integer("procedure_id"),
  description: text("description").notNull(),
  descriptionAr: text("description_ar"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0), // EGP
  total: real("total").notNull().default(0), // EGP
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MedicalInvoiceLine = typeof medicalInvoiceLinesTable.$inferSelect;
