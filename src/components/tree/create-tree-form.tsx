"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTree } from "@/lib/actions/tree";

export function CreateTreeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { slug, editToken } = await createTree(name.trim());
      router.push(`/tree/${slug}?token=${editToken}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Nemesio Clan"
        required
        disabled={loading}
        className="h-10 text-base"
      />
      <Button type="submit" disabled={!name.trim() || loading} className="h-10 px-5">
        {loading ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
