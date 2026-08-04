import { pgTable, serial, timestamp, integer, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteVisitsTable = pgTable("site_visits", {
  id: serial("id").primaryKey(),
  visitDate: date("visit_date", { mode: "string" }).notNull(),
  count: integer("count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [unique().on(t.visitDate)]);

export const insertSiteVisitSchema = createInsertSchema(siteVisitsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSiteVisit = z.infer<typeof insertSiteVisitSchema>;
export type SiteVisit = typeof siteVisitsTable.$inferSelect;
