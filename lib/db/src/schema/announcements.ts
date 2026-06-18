import { pgTable, serial, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type", { length: 20 }).notNull().default("info"), // info | event | alert
  eventDate: timestamp("event_date"),          // for event type
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by"),            // references users.id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),          // null = never expires
});

export type Announcement = typeof announcementsTable.$inferSelect;
