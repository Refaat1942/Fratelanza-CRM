import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: real("price").notNull().default(0),
  costPrice: real("cost_price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  reorderPoint: integer("reorder_point").notNull().default(5),
  category: text("category"),
  categoryAr: text("category_ar"),
  sku: text("sku"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Product = typeof productsTable.$inferSelect;
