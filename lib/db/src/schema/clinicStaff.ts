import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Clinic staff — doctors, nurses, assistants, receptionists working in the
// medical/clinical workspace. Kept separate from the generic Team/HR employees
// table on purpose: a clinic operator can manage just their clinical roster
// without mixing with admin/non-clinical staff.
export const clinicStaffTable = pgTable("clinic_staff", {
  id: serial("id").primaryKey(),
  name: text("name"),
  nameAr: text("name_ar"),
  role: text("role").notNull().default("doctor"), // doctor | nurse | assistant | receptionist | technician | other
  specialty: text("specialty"),
  specialtyAr: text("specialty_ar"),
  licenseNumber: text("license_number"),
  phone: text("phone"),
  email: text("email"),
  prescriptionTemplateUrl: text("prescription_template_url"),
  prescriptionHeader: text("prescription_header"),
  prescriptionHeaderAr: text("prescription_header_ar"),
  prescriptionFooter: text("prescription_footer"),
  prescriptionFooterAr: text("prescription_footer_ar"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClinicStaffSchema = createInsertSchema(clinicStaffTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertClinicStaff = z.infer<typeof insertClinicStaffSchema>;
export type ClinicStaff = typeof clinicStaffTable.$inferSelect;
