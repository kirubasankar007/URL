import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shortUrlsTable } from "./short_urls";

export const clickEventsTable = pgTable("click_events", {
  id: serial("id").primaryKey(),
  shortUrlId: integer("short_url_id").notNull().references(() => shortUrlsTable.id, { onDelete: "cascade" }),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClickEventSchema = createInsertSchema(clickEventsTable).omit({ id: true, clickedAt: true });
export type InsertClickEvent = z.infer<typeof insertClickEventSchema>;
export type ClickEvent = typeof clickEventsTable.$inferSelect;
