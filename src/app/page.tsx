"use client";

import { useState } from "react";
import { CreateTreeForm } from "@/components/tree/create-tree-form";
import { TreePreview } from "@/components/tree/tree-preview";
import type { TreeType } from "@/lib/types/tree";
import { LinkIcon, ImageDownIcon, SparklesIcon } from "lucide-react";

const PERKS = [
  { icon: SparklesIcon, label: "No account, ever" },
  { icon: LinkIcon, label: "Share with one link" },
  { icon: ImageDownIcon, label: "Export as an image" },
];

export default function Home() {
  const [treeType, setTreeType] = useState<TreeType>("family");
  const [name, setName] = useState("");

  return (
    <main className="relative flex-1 flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-14 lg:py-16 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
            No signup required
          </p>

          <div className="flex flex-col gap-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.02] text-balance">
              Build any tree.
              <br />
              <span className="text-muted-foreground">Share it with a link.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Family lineages, org charts, mind maps, skill roadmaps, decision trees. Name it,
              start branching, send the link.
            </p>
          </div>

          <CreateTreeForm
            treeType={treeType}
            onTreeTypeChange={setTreeType}
            name={name}
            onNameChange={setName}
          />

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <TreePreview key={treeType} type={treeType} name={name} />
      </div>
    </main>
  );
}
