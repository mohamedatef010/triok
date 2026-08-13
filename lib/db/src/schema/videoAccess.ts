import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { videosTable } from "./videos";
import { ordersTable } from "./orders";

export const videoAccessTable = pgTable(
  "video_access",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    videoId: integer("video_id")
      .notNull()
      .references(() => videosTable.id, { onDelete: "cascade" }),
    orderId: integer("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("video_access_user_video_idx").on(table.userId, table.videoId)],
);

export const insertVideoAccessSchema = createInsertSchema(videoAccessTable).omit({
  id: true,
  grantedAt: true,
});
export type InsertVideoAccess = z.infer<typeof insertVideoAccessSchema>;
export type VideoAccess = typeof videoAccessTable.$inferSelect;
