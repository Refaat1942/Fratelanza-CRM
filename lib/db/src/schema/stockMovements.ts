import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason"),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  userId: integer("user_id"),
  username: text("username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StockMovement = typeof stockMovementsTable.$inferSelect;
