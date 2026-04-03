"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTree } from "@/lib/actions/tree";
import { TREE_TYPES, type TreeType } from "@/lib/types/tree";
import { toast } from "sonner";

export function CreateTreeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [treeType, setTreeType] = useState<TreeType>("family");
  const [loading, setLoading] = useState(false);

  const placeholders: Record<TreeType, string> = {
    family: "e.g. Nemesio Clan",
    org: "e.g. Acme Corp",
    mindmap: "e.g. Project Ideas",
    skill: "e.g. Web Dev Roadmap",
    decision: "e.g. Career Path",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { slug, editToken } = await createTree(name.trim(), treeType);
      router.push(`/tree/${slug}?token=${editToken}`);
    } catch (e) {
      setLoading(false);
      toast.error(e instanceof Error ? e.message : "Failed to create tree");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md gap-4">
      {/* Type selector */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(TREE_TYPES) as [TreeType, typeof TREE_TYPES[TreeType]][]).map(
          ([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTreeType(key)}
              className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs transition-all ${
                treeType === key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="font-medium leading-tight text-center">{label}</span>
            </button>
          )
        )}
      </div>

      {/* Name + submit */}
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholders[treeType]}
          required
          disabled={loading}
          className="h-10 text-base"
        />
        <Button type="submit" disabled={!name.trim() || loading} className="h-10 px-5 shrink-0">
          {loading ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
