import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import type { FamilyTreeData, TreeType } from "../types/tree";

export const familyTrees = pgTable("family_trees", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  treeType: text("tree_type").$type<TreeType>().default("family").notNull(),
  treeData: jsonb("tree_data").$type<FamilyTreeData>().notNull(),
  editToken: text("edit_token").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
