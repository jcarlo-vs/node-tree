"use server";

import { db } from "../db";
import { familyTrees } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { FamilyTreeData } from "../types/tree";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    nanoid(6)
  );
}

export async function createTree(name: string) {
  const slug = slugify(name);
  const editToken = nanoid(24);
  const treeData: FamilyTreeData = {
    root: {
      id: crypto.randomUUID(),
      name,
      spouses: [],
      children: [],
    },
  };

  await db.insert(familyTrees).values({
    slug,
    name,
    treeData,
    editToken,
  });

  return { slug, editToken };
}

export async function getTree(slug: string) {
  const result = await db
    .select()
    .from(familyTrees)
    .where(eq(familyTrees.slug, slug))
    .limit(1);

  return result[0] ?? null;
}

export async function updateTree(
  slug: string,
  editToken: string,
  treeData: FamilyTreeData
) {
  const result = await db
    .update(familyTrees)
    .set({ treeData, updatedAt: new Date() })
    .where(and(eq(familyTrees.slug, slug), eq(familyTrees.editToken, editToken)))
    .returning({ id: familyTrees.id });

  if (result.length === 0) {
    throw new Error("Unauthorized");
  }

  return { success: true };
}
