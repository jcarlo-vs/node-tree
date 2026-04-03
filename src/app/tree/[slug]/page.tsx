import { notFound } from "next/navigation";
import { getTree } from "@/lib/actions/tree";
import { TreeClient } from "./tree-client";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
};

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
      initialTreeData={tree.treeData}
      isEditable={isEditable}
      editToken={isEditable ? tree.editToken : undefined}
    />
  );
}
