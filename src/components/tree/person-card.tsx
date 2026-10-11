"use client";

import type { PersonBase, PersonNode, TreeType } from "@/lib/types/tree";
import { MapPinIcon, StickyNoteIcon } from "lucide-react";

const CUSTOM_HUES: Record<string, number> = {
  blue: 250, teal: 190, green: 145, yellow: 95, orange: 60,
  red: 25, pink: 350, purple: 300, cyan: 210, rose: 10,
};

const STATUS_HUES = { completed: 145, "in-progress": 75, planned: 0 } as const;

function hashHue(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  return [250, 190, 60, 300, 350, 145, 30, 210][Math.abs(hash) % 8];
}

/**
 * The accent for a node. Anything the user set deliberately wins; otherwise the
 * branch colour, so hue tells you which part of the tree you're looking at
 * rather than how deep you are.
 */
export function hueFor(person: PersonBase, treeType: TreeType, branchHue: number): number | null {
  if (person.color && CUSTOM_HUES[person.color]) return CUSTOM_HUES[person.color];
  if (treeType === "skill" && person.status) {
    const h = STATUS_HUES[person.status];
    return h === 0 ? null : h;
  }
  if (treeType === "org" && person.department) return hashHue(person.department);
  return branchHue;
}

export const BRANCH_HUES = [250, 160, 45, 320, 130, 285, 200, 20];

const surface = (h: number | null) =>
  h === null ? "oklch(0.24 0 0)" : `oklch(0.26 0.02 ${h})`;
const edge = (h: number | null) =>
  h === null ? "oklch(1 0 0 / 0.16)" : `oklch(0.72 0.15 ${h} / 0.4)`;

function formatYears(birth?: number, death?: number) {
  if (!birth && !death) return null;
  return `${birth ?? "?"} - ${death ?? "present"}`;
}

function metaFor(person: PersonBase, treeType: TreeType): string | null {
  if (treeType === "family") return formatYears(person.birthYear, person.deathYear);
  if (treeType === "org") return person.role ?? null;
  if (treeType === "skill") {
    if (!person.status) return null;
    return person.status === "in-progress" ? "In progress"
      : person.status === "completed" ? "Completed" : "Planned";
  }
  return person.value ?? null;
}

/** Which rows this card will draw. The layout measures with this too. */
export function cardRows(person: PersonBase, treeType: TreeType) {
  return {
    dept: treeType === "org" && !!person.department,
    meta: metaFor(person, treeType),
    foot: (treeType === "family" && !!person.birthplace) || !!person.notes,
  };
}

const PAD_Y = 11;

/** Height that fits the content with even padding above and below. */
export function cardHeight(person: PersonBase, treeType: TreeType, isRoot: boolean) {
  const rows = cardRows(person, treeType);
  let h = PAD_Y * 2 + (isRoot ? 27 : 20);
  if (rows.dept) h += 15;
  if (rows.meta) h += isRoot ? 19 : 17;
  if (rows.foot) h += 15;
  return h;
}

type Props = {
  person: PersonNode | (PersonBase & { id: string });
  treeType: TreeType;
  hue: number | null;
  width: number;
  height: number;
  isRoot?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  /** renders the label as a focused input, so a new node can be named in place */
  isNaming?: boolean;
  onSelect?: () => void;
  onNameChange?: (name: string) => void;
  /** Enter, or Escape/blur when done */
  onNameCommit?: (next: "sibling" | "done" | "cancel") => void;
};

export function NodeCard({
  person, treeType, hue, width, height,
  isRoot, isSelected, isHighlighted, isNaming,
  onSelect, onNameChange, onNameCommit,
}: Props) {
  const { dept: showDepartment, meta } = cardRows(person, treeType);
  const showBirthplace = treeType === "family" && !!person.birthplace;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!isNaming && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.();
        }
      }}
      style={{
        width,
        height,
        background: surface(hue),
        borderColor: isSelected ? "oklch(0.95 0 0 / 0.85)" : edge(hue),
        boxShadow: isHighlighted ? "0 0 0 2px oklch(0.85 0.17 90 / 0.7)" : undefined,
      }}
      className={`group relative flex flex-col justify-center gap-0.5 rounded-xl border px-3.5 py-[11px] overflow-hidden transition-colors ${
        isRoot ? "text-center" : "text-left"
      } ${isSelected ? "border-2" : "hover:border-foreground/40"}`}
    >
      {showDepartment && (
        <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
          {person.department}
        </span>
      )}

      {isNaming ? (
        <input
          autoFocus
          value={person.name}
          aria-label="Node name"
          placeholder="Name it"
          spellCheck={false}
          onChange={(e) => onNameChange?.(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={() => onNameCommit?.("done")}   /* clicking away keeps the node */
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onNameCommit?.(e.shiftKey ? "done" : "sibling");
            } else if (e.key === "Escape") {
              e.preventDefault();
              onNameCommit?.("cancel");
            }
          }}
          className={`w-full bg-transparent border-0 p-0 outline-none font-semibold tracking-tight placeholder:text-muted-foreground/50 ${
            isRoot ? "text-[17px] text-center" : "text-[13px]"
          }`}
        />
      ) : (
        <span
          className={`block truncate font-semibold tracking-tight ${isRoot ? "text-[17px]" : "text-[13px]"}`}
          title={person.name}
        >
          {person.name || "Untitled"}
        </span>
      )}

      {meta && (
        <span className={`block truncate text-muted-foreground ${isRoot ? "text-xs" : "text-[11px]"}`}>
          {meta}
        </span>
      )}

      {(showBirthplace || person.notes) && (
        <span
          className={`flex items-center gap-2 text-[10px] text-muted-foreground/70 truncate ${
            isRoot ? "justify-center" : ""
          }`}
        >
          {showBirthplace && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPinIcon className="h-2.5 w-2.5 shrink-0" />
              {person.birthplace}
            </span>
          )}
          {person.notes && (
            <span className="flex items-center gap-0.5 truncate italic">
              <StickyNoteIcon className="h-2.5 w-2.5 shrink-0" />
              {person.notes}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
