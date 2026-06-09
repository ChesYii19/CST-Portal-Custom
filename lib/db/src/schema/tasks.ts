import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  dept: text("dept").notNull(),
  priority: text("priority").notNull().default("media"),
  status: text("status").notNull().default("todo"),
  assigneeInitials: text("assignee_initials").notNull().default("?"),
  assigneeColor: text("assignee_color").notNull().default("#6B7A85"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
