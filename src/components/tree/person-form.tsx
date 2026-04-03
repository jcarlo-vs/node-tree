"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TreeType } from "@/lib/types/tree";

export type PersonFormData = {
  name: string;
  birthYear?: number;
  deathYear?: number;
  gender?: "male" | "female" | "other";
  birthplace?: string;
  role?: string;
  department?: string;
  status?: "planned" | "in-progress" | "completed";
  value?: string;
  notes?: string;
  color?: string;
};

type PersonFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  treeType?: TreeType;
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => void;
};

function parseYear(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function OptionalTag() {
  return <span className="text-muted-foreground text-[10px]">(optional)</span>;
}

export function PersonForm({
  open,
  onOpenChange,
  title,
  treeType = "family",
  initialData,
  onSubmit,
}: PersonFormProps) {
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthplace, setBirthplace] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<string>("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setBirthYear(initialData?.birthYear?.toString() ?? "");
      setDeathYear(initialData?.deathYear?.toString() ?? "");
      setGender(initialData?.gender ?? "");
      setBirthplace(initialData?.birthplace ?? "");
      setRole(initialData?.role ?? "");
      setDepartment(initialData?.department ?? "");
      setStatus(initialData?.status ?? "");
      setValue(initialData?.value ?? "");
      setNotes(initialData?.notes ?? "");
      setColor(initialData?.color ?? "");
    }
  }, [open, initialData]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      birthYear: parseYear(birthYear),
      deathYear: parseYear(deathYear),
      gender: gender ? (gender as "male" | "female" | "other") : undefined,
      birthplace: birthplace.trim() || undefined,
      role: role.trim() || undefined,
      department: department.trim() || undefined,
      status: status ? (status as "planned" | "in-progress" | "completed") : undefined,
      value: value.trim() || undefined,
      notes: notes.trim() || undefined,
      color: color || undefined,
    });
    onOpenChange(false);
  }

  const nameLabels: Record<TreeType, string> = {
    family: "Name",
    org: "Name",
    mindmap: "Title",
    skill: "Skill Name",
    decision: "Label",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name — always required */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              {nameLabels[treeType]} <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                treeType === "family" ? "e.g. Juan Dela Cruz" :
                treeType === "org" ? "e.g. John Smith" :
                treeType === "mindmap" ? "e.g. Marketing Strategy" :
                treeType === "skill" ? "e.g. React Hooks" :
                "e.g. Accept offer?"
              }
              required
            />
          </div>

          {/* Family tree fields */}
          {treeType === "family" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="birthYear">Birth Year <OptionalTag /></Label>
                  <Input id="birthYear" type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="e.g. 1950" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deathYear">Death Year <OptionalTag /></Label>
                  <Input id="deathYear" type="number" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} placeholder="e.g. 2020" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="birthplace">Birthplace <OptionalTag /></Label>
                <Input id="birthplace" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} placeholder="e.g. Manila, Philippines" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Gender <OptionalTag /></Label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <Button key={g} type="button" variant={gender === g ? "default" : "outline"} size="sm" onClick={() => setGender(gender === g ? "" : g)}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Org chart fields */}
          {treeType === "org" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Role / Title <OptionalTag /></Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Engineering Manager" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department">Department <OptionalTag /></Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
              </div>
            </>
          )}

          {/* Skill tree fields */}
          {treeType === "skill" && (
            <div className="flex flex-col gap-1.5">
              <Label>Status <OptionalTag /></Label>
              <div className="flex gap-2">
                {(["planned", "in-progress", "completed"] as const).map((s) => (
                  <Button key={s} type="button" variant={status === s ? "default" : "outline"} size="sm" onClick={() => setStatus(status === s ? "" : s)}>
                    {s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Decision / mind map value field */}
          {(treeType === "decision" || treeType === "mindmap") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="value">
                {treeType === "decision" ? "Outcome / Description" : "Details"} <OptionalTag />
              </Label>
              <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} placeholder={treeType === "decision" ? "e.g. Higher salary but longer commute" : "e.g. More details here..."} />
            </div>
          )}

          {/* Notes — always available */}
          {/* Color picker — non-family types only */}
          {treeType !== "family" && (
            <div className="flex flex-col gap-1.5">
              <Label>Node Color <OptionalTag /></Label>
              <div className="flex flex-wrap gap-1.5">
                {/* Default option */}
                <button
                  type="button"
                  onClick={() => setColor("")}
                  className={`w-6 h-6 rounded-full border-2 transition-all bg-card ${
                    !color ? "border-foreground scale-110" : "border-border/50 hover:border-border"
                  }`}
                  title="Default"
                />
                {[
                  { value: "blue", bg: "bg-blue-500" },
                  { value: "teal", bg: "bg-teal-500" },
                  { value: "green", bg: "bg-emerald-500" },
                  { value: "yellow", bg: "bg-yellow-500" },
                  { value: "orange", bg: "bg-orange-500" },
                  { value: "red", bg: "bg-red-500" },
                  { value: "pink", bg: "bg-pink-500" },
                  { value: "purple", bg: "bg-purple-500" },
                  { value: "cyan", bg: "bg-cyan-500" },
                  { value: "rose", bg: "bg-rose-500" },
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(color === c.value ? "" : c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${
                      color === c.value ? "border-foreground scale-110" : "border-transparent hover:border-foreground/30"
                    }`}
                    title={c.value}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes <OptionalTag /></Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
