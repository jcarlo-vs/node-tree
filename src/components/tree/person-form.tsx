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

export type PersonFormData = {
  name: string;
  birthYear?: number;
  deathYear?: number;
  gender?: "male" | "female" | "other";
  birthplace?: string;
  notes?: string;
};

type PersonFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => void;
};

function parseYear(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function PersonForm({
  open,
  onOpenChange,
  title,
  initialData,
  onSubmit,
}: PersonFormProps) {
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthplace, setBirthplace] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setBirthYear(initialData?.birthYear?.toString() ?? "");
      setDeathYear(initialData?.deathYear?.toString() ?? "");
      setGender(initialData?.gender ?? "");
      setBirthplace(initialData?.birthplace ?? "");
      setNotes(initialData?.notes ?? "");
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
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="birthYear">
                Birth Year <span className="text-muted-foreground text-[10px]">(optional)</span>
              </Label>
              <Input
                id="birthYear"
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="e.g. 1950"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deathYear">
                Death Year <span className="text-muted-foreground text-[10px]">(optional)</span>
              </Label>
              <Input
                id="deathYear"
                type="number"
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                placeholder="e.g. 2020"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="birthplace">
              Birthplace <span className="text-muted-foreground text-[10px]">(optional)</span>
            </Label>
            <Input
              id="birthplace"
              value={birthplace}
              onChange={(e) => setBirthplace(e.target.value)}
              placeholder="e.g. Manila, Philippines"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>
              Gender <span className="text-muted-foreground text-[10px]">(optional)</span>
            </Label>
            <div className="flex gap-2">
              {(["male", "female", "other"] as const).map((g) => (
                <Button
                  key={g}
                  type="button"
                  variant={gender === g ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGender(gender === g ? "" : g)}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">
              Notes <span className="text-muted-foreground text-[10px]">(optional)</span>
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Eldest child, moved to USA"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
