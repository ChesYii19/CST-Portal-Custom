import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const themeSettingsTable = pgTable("theme_settings", {
  id: serial("id").primaryKey(),
  darkMode: boolean("dark_mode").notNull().default(false),
  primaryColor: text("primary_color").notNull().default("#2E5A6A"),
  accentColor: text("accent_color").notNull().default("#3ECCD0"),
  fontFamily: text("font_family").notNull().default("Segoe UI"),
  borderRadius: integer("border_radius").notNull().default(8),
  compactMode: boolean("compact_mode").notNull().default(false),
  orgName: text("org_name").notNull().default("Casa Santa Teresinha"),
  orgSlogan: text("org_slogan").notNull().default("Acolher • Cuidar • Transformar"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertThemeSettingsSchema = createInsertSchema(themeSettingsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertThemeSettings = z.infer<typeof insertThemeSettingsSchema>;
export type ThemeSettings = typeof themeSettingsTable.$inferSelect;
