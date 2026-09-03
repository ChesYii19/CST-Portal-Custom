import { pgTable, serial, text, varchar, timestamp, integer, bigint, boolean, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const datasetsTable = pgTable(
  "datasets",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    ownerId: integer("owner_id").notNull().references(() => usersTable.id),
    dept: text("dept").notNull(),
    categoryId: integer("category_id"),
    status: varchar("status", { length: 30 }).notNull().default("draft"),
    sourceFormat: varchar("source_format", { length: 20 }).notNull(),
    currentVersionId: integer("current_version_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    slugUnique: uniqueIndex("datasets_slug_unique").on(table.slug),
    ownerIdx: index("datasets_owner_idx").on(table.ownerId),
    deptIdx: index("datasets_dept_idx").on(table.dept),
    statusIdx: index("datasets_status_idx").on(table.status),
  }),
);

export const insertDatasetSchema = createInsertSchema(datasetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type Dataset = typeof datasetsTable.$inferSelect;


export const datasetFilesTable = pgTable(
  "dataset_files",
  {
    id: serial("id").primaryKey(),
    datasetId: integer("dataset_id").notNull().references(() => datasetsTable.id),
    versionId: integer("version_id"),
    storageKey: text("storage_key").notNull(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    extension: varchar("extension", { length: 20 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    checksumSha256: varchar("checksum_sha256", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    datasetIdx: index("dataset_files_dataset_idx").on(table.datasetId),
    versionIdx: index("dataset_files_version_idx").on(table.versionId),
    checksumIdx: index("dataset_files_checksum_idx").on(table.checksumSha256),
  }),
);

export const insertDatasetFileSchema = createInsertSchema(datasetFilesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDatasetFile = z.infer<typeof insertDatasetFileSchema>;
export type DatasetFile = typeof datasetFilesTable.$inferSelect;


export const datasetVersionsTable = pgTable(
  "dataset_versions",
  {
    id: serial("id").primaryKey(),
    datasetId: integer("dataset_id").notNull().references(() => datasetsTable.id),
    versionNumber: integer("version_number").notNull(),
    status: varchar("status", { length: 30 }).notNull().default("processing"),
    rowCount: integer("row_count"),
    columnCount: integer("column_count"),
    createdById: integer("created_by_id").notNull().references(() => usersTable.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    datasetVersionUnique: uniqueIndex("dataset_versions_dataset_version_unique").on(
      table.datasetId,
      table.versionNumber,
    ),
    datasetIdx: index("dataset_versions_dataset_idx").on(table.datasetId),
    createdByIdx: index("dataset_versions_created_by_idx").on(table.createdById),
  }),
);

export const insertDatasetVersionSchema = createInsertSchema(datasetVersionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDatasetVersion = z.infer<typeof insertDatasetVersionSchema>;
export type DatasetVersion = typeof datasetVersionsTable.$inferSelect;


export const datasetColumnsTable = pgTable(
  "dataset_columns",
  {
    id: serial("id").primaryKey(),
    versionId: integer("version_id").notNull().references(() => datasetVersionsTable.id),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    position: integer("position").notNull(),
    dataType: varchar("data_type", { length: 30 }).notNull(),
    nullable: boolean("nullable").notNull().default(true),
    isDimension: boolean("is_dimension").notNull().default(false),
    isMeasure: boolean("is_measure").notNull().default(false),
    statistics: jsonb("statistics"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    versionIdx: index("dataset_columns_version_idx").on(table.versionId),
    versionPositionUnique: uniqueIndex("dataset_columns_version_position_unique").on(
      table.versionId,
      table.position,
    ),
  }),
);

export const insertDatasetColumnSchema = createInsertSchema(datasetColumnsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDatasetColumn = z.infer<typeof insertDatasetColumnSchema>;
export type DatasetColumn = typeof datasetColumnsTable.$inferSelect;


export const categoriesTable = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("categories_name_unique").on(table.name),
  }),
);

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;


export const tagsTable = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    normalizedNameUnique: uniqueIndex("tags_normalized_name_unique").on(table.normalizedName),
  }),
);

export const insertTagSchema = createInsertSchema(tagsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tagsTable.$inferSelect;


export const datasetTagsTable = pgTable(
  "dataset_tags",
  {
    datasetId: integer("dataset_id").notNull().references(() => datasetsTable.id),
    tagId: integer("tag_id").notNull().references(() => tagsTable.id),
  },
  (table) => ({
    primaryKey: uniqueIndex("dataset_tags_unique").on(table.datasetId, table.tagId),
    datasetIdx: index("dataset_tags_dataset_idx").on(table.datasetId),
    tagIdx: index("dataset_tags_tag_idx").on(table.tagId),
  }),
);

export type DatasetTag = typeof datasetTagsTable.$inferSelect;


export const datasetPermissionsTable = pgTable(
  "dataset_permissions",
  {
    id: serial("id").primaryKey(),
    datasetId: integer("dataset_id").notNull().references(() => datasetsTable.id),
    userId: integer("user_id").references(() => usersTable.id),
    role: varchar("role", { length: 50 }),
    dept: text("dept"),
    canView: boolean("can_view").notNull().default(true),
    canDownload: boolean("can_download").notNull().default(false),
    canImport: boolean("can_import").notNull().default(false),
    canEdit: boolean("can_edit").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    canShare: boolean("can_share").notNull().default(false),
    createdById: integer("created_by_id").notNull().references(() => usersTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    datasetIdx: index("dataset_permissions_dataset_idx").on(table.datasetId),
    userIdx: index("dataset_permissions_user_idx").on(table.userId),
    roleIdx: index("dataset_permissions_role_idx").on(table.role),
    deptIdx: index("dataset_permissions_dept_idx").on(table.dept),
  }),
);

export const insertDatasetPermissionSchema = createInsertSchema(datasetPermissionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDatasetPermission = z.infer<typeof insertDatasetPermissionSchema>;
export type DatasetPermission = typeof datasetPermissionsTable.$inferSelect;
