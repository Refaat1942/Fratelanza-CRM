import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const tenantSettingsTable = pgTable("tenant_settings", {
  id: integer("id").primaryKey().default(1),
  companyName: text("company_name"),
  companyNameAr: text("company_name_ar"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type TenantSettings = typeof tenantSettingsTable.$inferSelect;
