"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTree } from "@/lib/actions/tree";
import { TREE_TYPES, type TreeType } from "@/lib/types/tree";
import { treeTypeExample } from "./tree-preview";
import {
  UsersIcon,
  Building2Icon,
  BrainIcon,
  ZapIcon,
  SplitIcon,
  ArrowRightIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<TreeType, LucideIcon> = {
  family: UsersIcon,
  org: Building2Icon,
  mindmap: BrainIcon,
  skill: ZapIcon,
  decision: SplitIcon,
};

type Props = {
  treeType: TreeType;
  onTreeTypeChange: (type: TreeType) => void;
  name: string;
  onNameChange: (name: string) => void;
};

export function CreateTreeForm({ treeType, onTreeTypeChange, name, onNameChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-lg gap-3">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TREE_TYPES) as TreeType[]).map((key) => {
          const Icon = ICONS[key];
          const selected = treeType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTreeTypeChange(key)}
              aria-pressed={selected}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                selected
                  ? "border-primary/70 bg-primary/15 text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {TREE_TYPES[key].label}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground -mt-0.5">
        {TREE_TYPES[treeType].description}
      </p>

      <div className="flex gap-2">
        <Input
          id="tree-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={`e.g. ${treeTypeExample(treeType)}`}
          aria-label="Tree name"
          required
          disabled={loading}
          className="h-11 text-base"
        />
        <Button type="submit" disabled={!name.trim() || loading} className="h-11 px-5 shrink-0">
          {loading ? "Creating…" : "Create"}
          {!loading && <ArrowRightIcon className="h-4 w-4 ml-1.5" />}
        </Button>
      </div>
    </form>
  );
}
