"use server";

import { db } from "../db";
import { familyTrees } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import type { FamilyTreeData, TreeType } from "../types/tree";
import { rateLimit } from "../rate-limit";

const MAX_TREE_SIZE = 512 * 1024; // 512 KB max per tree

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    nanoid(8)
  );
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function createTree(name: string, treeType: TreeType = "family") {
  if (!name.trim()) throw new Error("Name is required");
  if (name.length > 100) throw new Error("Name too long");

  const ip = await getClientIp();
  const limit = rateLimit(`create:${ip}`, { maxRequests: 10, windowMs: 60 * 60 * 1000 }); // 10 trees per hour per IP
  if (!limit.success) throw new Error("Too many requests. Try again later.");

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
    treeType,
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
  // Validate payload size
  const dataSize = JSON.stringify(treeData).length;
  if (dataSize > MAX_TREE_SIZE) {
    throw new Error("Tree data too large. Maximum 512 KB.");
  }

  // Rate limit: 60 saves per minute per tree
  const limit = rateLimit(`update:${slug}`, { maxRequests: 60, windowMs: 60 * 1000 });
  if (!limit.success) throw new Error("Too many saves. Slow down.");

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
