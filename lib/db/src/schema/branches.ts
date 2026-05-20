import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  address: text("address"),
  addressAr: text("address_ar"),
  phone: text("phone"),
  manager: text("manager"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Branch = typeof branchesTable.$inferSelect;
