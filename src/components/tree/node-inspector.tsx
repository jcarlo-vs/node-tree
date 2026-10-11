"use client";

import type { PersonBase, TreeType } from "@/lib/types/tree";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XIcon, PlusIcon, Trash2Icon, HeartIcon, CheckIcon } from "lucide-react";

const NAME_LABEL: Record<TreeType, string> = {
  family: "Name",
  org: "Name",
  mindmap: "Title",
  skill: "Skill",
  decision: "Label",
};

const COLORS = [
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
];

type Props = {
  /** null when nothing is selected */
  person: (PersonBase & { id: string }) | null;
  treeType: TreeType;
  isEditable: boolean;
  isRoot: boolean;
  isSpouse: boolean;
  saveState: "idle" | "saving" | "error";
  onChange: (patch: Partial<PersonBase>) => void;
  onAddChild: () => void;
  onAddSpouse: () => void;
  onDelete: () => void;
  onClose: () => void;
  onRetry: () => void;
};

export function NodeInspector({
  person, treeType, isEditable, isRoot, isSpouse,
  saveState, onChange, onAddChild, onAddSpouse, onDelete, onClose, onRetry,
}: Props) {
  return (
    <aside
      className="
        shrink-0 border-border/60 bg-card/40 backdrop-blur-sm z-30 flex flex-col
        max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[58svh] max-md:border-t max-md:rounded-t-2xl
        md:w-[272px] md:border-r md:h-full
      "
      aria-label="Node inspector"
    >
      {person ? (
        <>
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60 shrink-0">
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                {isSpouse ? "Partner" : isRoot ? "Root" : "Node"}
              </p>
              <p className="truncate text-sm font-semibold">{person.name || "Untitled"}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose} title="Close">
              <XIcon className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5">
            <Field label={NAME_LABEL[treeType]}>
              <Input
                value={person.name}
                disabled={!isEditable}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Untitled"
              />
            </Field>

            {treeType === "family" && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Born">
                    <Input
                      type="number"
                      value={person.birthYear ?? ""}
                      disabled={!isEditable}
                      onChange={(e) => onChange({ birthYear: numberOrUndefined(e.target.value) })}
                      placeholder="1950"
                    />
                  </Field>
                  <Field label="Died">
                    <Input
                      type="number"
                      value={person.deathYear ?? ""}
                      disabled={!isEditable}
                      onChange={(e) => onChange({ deathYear: numberOrUndefined(e.target.value) })}
                      placeholder="2020"
                    />
                  </Field>
                </div>
                <Field label="Birthplace">
                  <Input
                    value={person.birthplace ?? ""}
                    disabled={!isEditable}
                    onChange={(e) => onChange({ birthplace: e.target.value })}
                    placeholder="Manila"
                  />
                </Field>
                <Field label="Gender">
                  <Choices
                    options={["male", "female", "other"]}
                    value={person.gender}
                    disabled={!isEditable}
                    onPick={(v) => onChange({ gender: v as PersonBase["gender"] })}
                  />
                </Field>
              </>
            )}

            {treeType === "org" && (
              <>
                <Field label="Role">
                  <Input
                    value={person.role ?? ""}
                    disabled={!isEditable}
                    onChange={(e) => onChange({ role: e.target.value })}
                    placeholder="Engineering Manager"
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={person.department ?? ""}
                    disabled={!isEditable}
                    onChange={(e) => onChange({ department: e.target.value })}
                    placeholder="Engineering"
                  />
                </Field>
              </>
            )}

            {treeType === "skill" && (
              <Field label="Status">
                <Choices
                  options={["planned", "in-progress", "completed"]}
                  value={person.status}
                  disabled={!isEditable}
                  labels={{ "in-progress": "In progress" }}
                  onPick={(v) => onChange({ status: v as PersonBase["status"] })}
                />
              </Field>
            )}

            {(treeType === "decision" || treeType === "mindmap") && (
              <Field label={treeType === "decision" ? "Outcome" : "Details"}>
                <Input
                  value={person.value ?? ""}
                  disabled={!isEditable}
                  onChange={(e) => onChange({ value: e.target.value })}
                  placeholder={treeType === "decision" ? "Higher salary, longer commute" : "More details"}
                />
              </Field>
            )}

            {treeType !== "family" && (
              <Field label="Colour">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={!isEditable}
                    onClick={() => onChange({ color: undefined })}
                    title="Match the branch"
                    className={`h-6 w-6 rounded-full border-2 bg-card transition-transform ${
                      !person.color ? "border-foreground scale-110" : "border-border/50 hover:border-border"
                    }`}
                  />
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      disabled={!isEditable}
                      onClick={() => onChange({ color: person.color === c.value ? undefined : c.value })}
                      title={c.value}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${c.bg} ${
                        person.color === c.value ? "border-foreground scale-110" : "border-transparent hover:border-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </Field>
            )}

            <Field label="Notes">
              <Input
                value={person.notes ?? ""}
                disabled={!isEditable}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Anything else"
              />
            </Field>
          </div>

          {isEditable && (
            <footer className="shrink-0 border-t border-border/60 px-4 py-3 flex flex-col gap-2">
              <SaveState state={saveState} onRetry={onRetry} />
              {!isSpouse && (
                <>
                  <Button size="sm" onClick={onAddChild} className="w-full">
                    <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                    Add {treeType === "family" ? "child" : "node"}
                  </Button>
                  {treeType === "family" && (
                    <Button size="sm" variant="outline" onClick={onAddSpouse} className="w-full">
                      <HeartIcon className="h-3.5 w-3.5 mr-1.5" />
                      Add partner
                    </Button>
                  )}
                </>
              )}
              {!isRoot && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2Icon className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              )}
            </footer>
          )}
        </>
      ) : (
        <div className="hidden md:flex flex-1 flex-col justify-center gap-2 px-5 text-center">
          <p className="text-sm font-medium">Nothing selected</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click a node to edit it here. Everything you type saves as you go.
          </p>
        </div>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Choices({
  options, value, onPick, disabled, labels,
}: {
  options: readonly string[];
  value?: string;
  onPick: (v: string | undefined) => void;
  disabled?: boolean;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Button
          key={o}
          type="button"
          size="sm"
          disabled={disabled}
          variant={value === o ? "default" : "outline"}
          className="h-7 text-xs px-2.5"
          onClick={() => onPick(value === o ? undefined : o)}
        >
          {labels?.[o] ?? o.charAt(0).toUpperCase() + o.slice(1)}
        </Button>
      ))}
    </div>
  );
}

/** No Save button — this reports what already happened. */
function SaveState({ state, onRetry }: { state: "idle" | "saving" | "error"; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[11px] font-medium text-destructive hover:underline"
      >
        Not saved — retry
      </button>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {state === "saving" ? (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
          Saving…
        </>
      ) : (
        <>
          <CheckIcon className="h-3 w-3 text-emerald-500" />
          Saved
        </>
      )}
    </p>
  );
}

function numberOrUndefined(v: string) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
