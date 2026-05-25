import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const tenantSettingsTable = pgTable("tenant_settings", {
  id: integer("id").primaryKey().default(1),
  companyName: text("company_name"),
  companyNameAr: text("company_name_ar"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  // Prescription / clinic header fields — used to render the printable
  // prescription template. Doctor name on each prescription comes from the
  // visit's assigned doctor (employees table); these fields are the default
  // clinic header that prints above the prescription body.
  clinicPhone: text("clinic_phone"),
  clinicAddress: text("clinic_address"),
  clinicAddressAr: text("clinic_address_ar"),
  doctorTitle: text("doctor_title"),
  doctorTitleAr: text("doctor_title_ar"),
  doctorLicense: text("doctor_license"),
  prescriptionFooter: text("prescription_footer"),
  prescriptionFooterAr: text("prescription_footer_ar"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type TenantSettings = typeof tenantSettingsTable.$inferSelect;
