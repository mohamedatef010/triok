import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const videoProcessingStatusEnum = pgEnum("video_processing_status", [
  "none",
  "uploaded",
  "processing",
  "ready",
  "failed",
]);

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  previewVideoUrl: text("preview_video_url"),
  sourceStorageKey: text("source_storage_key"),
  hlsFullStorageKey: text("hls_full_storage_key"),
  hlsPreviewStorageKey: text("hls_preview_storage_key"),
  processingStatus: videoProcessingStatusEnum("processing_status").notNull().default("none"),
  processingError: text("processing_error"),
  durationSeconds: integer("duration_seconds"),
  previewDurationSeconds: integer("preview_duration_seconds"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  discountPrice: numeric("discount_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categoriesTable.id, {
    onDelete: "set null",
  }),
  viewCount: integer("view_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
