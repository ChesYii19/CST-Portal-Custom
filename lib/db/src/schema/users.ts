import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("employee"),
  dept: text("dept").notNull(),
  initials: varchar("initials", { length: 10 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#2E5A6A"),
  status: varchar("status", { length: 20 }).notNull().default("ativo"),
  loginAttempts: serial("login_attempts").notNull(),
  lockedAt: timestamp("locked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  loginAttempts: true,
  lockedAt: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
