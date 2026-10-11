import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTree } from "@/lib/actions/tree";
import { TreeClient } from "./tree-client";
import { TREE_TYPES, type TreeType } from "@/lib/types/tree";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tree = await getTree(slug);
  if (!tree) return { title: "Tree not found" };

  const type = TREE_TYPES[(tree.treeType as TreeType) ?? "family"];
  return {
    title: `${tree.name} · ${type.label}`,
    description: `View the ${type.label.toLowerCase()} for ${tree.name}`,
  };
}

export default async function TreePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  const tree = await getTree(slug);
  if (!tree) notFound();

  const isEditable = token === tree.editToken;

  return (
    <TreeClient
      slug={slug}
      name={tree.name}
      treeType={(tree.treeType as TreeType) ?? "family"}
      initialTreeData={tree.treeData}
      isEditable={isEditable}
      editToken={isEditable ? tree.editToken : undefined}
    />
  );
}
