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
  materialsUsed: text("materials_used"),
  materialsUsedAr: text("materials_used_ar"),
  toothNumber: text("tooth_number"),
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
  medicineMasterId: integer("medicine_master_id"),
  medicineMaterial: text("medicine_material"),
  medicineUnit: text("medicine_unit"),
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

// =============== Medicine Master Data ===============
// Imported customer-provided item catalog used by prescription entry.
export const medicineMasterTable = pgTable("medicine_master", {
  id: serial("id").primaryKey(),
  material: text("material").notNull(),
  materialDescription: text("material_description").notNull(),
  bun: text("bun"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type MedicineMaster = typeof medicineMasterTable.$inferSelect;

// =============== Doctor Prescription Templates ===============
// Optional doctor-specific prescription background/shape used while printing.
export const doctorPrescriptionTemplatesTable = pgTable("doctor_prescription_templates", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  active: integer("active").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type DoctorPrescriptionTemplate = typeof doctorPrescriptionTemplatesTable.$inferSelect;

// =============== Medical Specialization Catalog ===============
// Seeded from admin customer specialization and used as visit-form suggestions.
export const medicalSpecializationCatalogTable = pgTable("medical_specialization_catalog", {
  id: serial("id").primaryKey(),
  specialization: text("specialization").notNull(),
  type: text("type").notNull(), // diagnosis | feature
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type MedicalSpecializationCatalogItem = typeof medicalSpecializationCatalogTable.$inferSelect;

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

// =============== Medical Materials Inventory ===============
// Clinic supplies/stock (gloves, syringes, composites, anesthetics, etc.)
export const medicalMaterialsTable = pgTable("medical_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  sku: text("sku"),
  category: text("category"), // 'consumable' | 'dental' | 'medication' | 'equipment' | 'other'
  unit: text("unit"), // 'pcs' | 'box' | 'tube' | 'ml' | 'g' ...
  quantityInStock: real("quantity_in_stock").notNull().default(0),
  reorderLevel: real("reorder_level").notNull().default(0),
  unitPrice: real("unit_price").notNull().default(0), // EGP
  supplier: text("supplier"),
  notes: text("notes"),
  notesAr: text("notes_ar"),
  branchId: integer("branch_id"),
  active: integer("active").notNull().default(1), // 1 = active, 0 = archived
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type MedicalMaterial = typeof medicalMaterialsTable.$inferSelect;
