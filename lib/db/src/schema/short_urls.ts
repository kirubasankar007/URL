import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const shortUrlsTable = pgTable("short_urls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  originalUrl: text("original_url").notNull(),
  shortCode: text("short_code").notNull().unique(),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShortUrlSchema = createInsertSchema(shortUrlsTable).omit({ id: true, clickCount: true, createdAt: true });
export type InsertShortUrl = z.infer<typeof insertShortUrlSchema>;
export type ShortUrl = typeof shortUrlsTable.$inferSelect;
