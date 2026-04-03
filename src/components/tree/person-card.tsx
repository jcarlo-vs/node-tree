"use client";

import { useState } from "react";
import type { PersonNode, Spouse, TreeType } from "@/lib/types/tree";
import { countDescendants } from "@/lib/tree-utils";
import { Button } from "@/components/ui/button";
import { PersonForm } from "./person-form";
import { ConfirmDialog } from "./confirm-dialog";
import {
  HeartIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MapPinIcon,
  StickyNoteIcon,
} from "lucide-react";

type PersonCardProps = {
  person: PersonNode;
  treeType: TreeType;
  isEditable: boolean;
  isRoot?: boolean;
  onAddChild: (parentId: string, data: Record<string, unknown>) => void;
  onEditPerson: (nodeId: string, data: Record<string, unknown>) => void;
  onRemovePerson: (nodeId: string) => void;
  onAddSpouse: (nodeId: string, data: Record<string, unknown>) => void;
  onEditSpouse: (nodeId: string, spouseId: string, data: Record<string, unknown>) => void;
  onRemoveSpouse: (nodeId: string, spouseId: string) => void;
};

const DEPT_COLORS = [
  { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-200", badge: "bg-blue-500/20 text-blue-300" },
  { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-200", badge: "bg-teal-500/20 text-teal-300" },
  { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-200", badge: "bg-amber-500/20 text-amber-300" },
  { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-200", badge: "bg-purple-500/20 text-purple-300" },
  { border: "border-rose-500/30", bg: "bg-rose-500/10", text: "text-rose-200", badge: "bg-rose-500/20 text-rose-300" },
  { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-200", badge: "bg-emerald-500/20 text-emerald-300" },
  { border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-200", badge: "bg-orange-500/20 text-orange-300" },
  { border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-200", badge: "bg-cyan-500/20 text-cyan-300" },
];

function getDeptColor(department?: string) {
  if (!department) return null;
  let hash = 0;
  for (let i = 0; i < department.length; i++) hash = department.charCodeAt(i) + ((hash << 5) - hash);
  return DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
}

const SKILL_STATUS_STYLES = {
  completed: { border: "border-green-500/30", bg: "bg-green-500/10" },
  "in-progress": { border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
  planned: { border: "border-border", bg: "bg-card" },
};

const CUSTOM_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  blue:   { border: "border-blue-500/40",   bg: "bg-blue-500/15",   text: "text-blue-200" },
  teal:   { border: "border-teal-500/40",   bg: "bg-teal-500/15",   text: "text-teal-200" },
  green:  { border: "border-emerald-500/40", bg: "bg-emerald-500/15", text: "text-emerald-200" },
  yellow: { border: "border-yellow-500/40", bg: "bg-yellow-500/15", text: "text-yellow-200" },
  orange: { border: "border-orange-500/40", bg: "bg-orange-500/15", text: "text-orange-200" },
  red:    { border: "border-red-500/40",    bg: "bg-red-500/15",    text: "text-red-200" },
  pink:   { border: "border-pink-500/40",   bg: "bg-pink-500/15",   text: "text-pink-200" },
  purple: { border: "border-purple-500/40", bg: "bg-purple-500/15", text: "text-purple-200" },
  cyan:   { border: "border-cyan-500/40",   bg: "bg-cyan-500/15",   text: "text-cyan-200" },
  rose:   { border: "border-rose-500/40",   bg: "bg-rose-500/15",   text: "text-rose-200" },
};

function getCardStyle(treeType: TreeType, person: PersonNode) {
  // Custom color takes priority (non-family only)
  if (treeType !== "family" && person.color && CUSTOM_COLORS[person.color]) {
    const c = CUSTOM_COLORS[person.color];
    return `${c.border} ${c.bg}`;
  }
  if (treeType === "family") {
    if (person.gender === "male") return "border-blue-500/30 bg-blue-500/10 text-blue-100";
    if (person.gender === "female") return "border-pink-500/30 bg-pink-500/10 text-pink-100";
  }
  if (treeType === "org" && person.department) {
    const c = getDeptColor(person.department);
    if (c) return `${c.border} ${c.bg}`;
  }
  if (treeType === "skill" && person.status) {
    const s = SKILL_STATUS_STYLES[person.status];
    return `${s.border} ${s.bg}`;
  }
  return "border-border bg-card text-card-foreground";
}

function getNameColor(treeType: TreeType, person: PersonNode) {
  // Custom color takes priority (non-family only)
  if (treeType !== "family" && person.color && CUSTOM_COLORS[person.color]) {
    return CUSTOM_COLORS[person.color].text;
  }
  if (treeType === "family") {
    if (person.gender === "male") return "text-blue-200";
    if (person.gender === "female") return "text-pink-200";
  }
  if (treeType === "org" && person.department) {
    const c = getDeptColor(person.department);
    if (c) return c.text;
  }
  return "text-foreground";
}

function formatYears(birth?: number, death?: number) {
  if (!birth && !death) return null;
  return `${birth ?? "?"} \u2013 ${death ?? "present"}`;
}

export function PersonCard({
  person,
  treeType,
  isEditable,
  isRoot,
  onAddChild,
  onEditPerson,
  onRemovePerson,
  onAddSpouse,
  onEditSpouse,
  onRemoveSpouse,
}: PersonCardProps) {
  const [showAddChild, setShowAddChild] = useState(false);
  const [showEditPerson, setShowEditPerson] = useState(false);
  const [showAddSpouse, setShowAddSpouse] = useState(false);
  const [editingSpouse, setEditingSpouse] = useState<Spouse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteSpouse, setConfirmDeleteSpouse] = useState<string | null>(null);

  const personYears = formatYears(person.birthYear, person.deathYear);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Person */}
        <div className="flex flex-col items-center gap-1">
          {/* Department badge for org chart */}
          {treeType === "org" && person.department && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getDeptColor(person.department)?.badge ?? "bg-muted text-muted-foreground"}`}>
              {person.department}
            </span>
          )}
        <div
          className={`rounded-xl border text-center shadow-md backdrop-blur-sm transition-all hover:shadow-lg ${
            isRoot
              ? "px-12 py-6 min-w-[260px] border-2 shadow-xl rounded-2xl"
              : "px-4 py-2.5 min-w-[130px]"
          } ${getCardStyle(treeType, person)}`}
        >
          <p
            className={`font-semibold tracking-wide ${
              isRoot ? "text-xl" : "text-[13px]"
            } ${getNameColor(treeType, person)}`}
          >
            {person.name}
          </p>
          {/* Type-specific metadata */}
          {treeType === "family" && personYears && (
            <p className={`text-muted-foreground ${isRoot ? "text-sm mt-1.5" : "text-[11px] mt-0.5"}`}>
              {personYears}
            </p>
          )}
          {treeType === "family" && person.birthplace && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center justify-center gap-0.5">
              <MapPinIcon className="h-2.5 w-2.5" />
              {person.birthplace}
            </p>
          )}
          {treeType === "org" && person.role && (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5 font-medium">{person.role}</p>
          )}
          {treeType === "skill" && person.status && (
            <p className={`text-[10px] mt-0.5 font-medium ${
              person.status === "completed" ? "text-green-400" :
              person.status === "in-progress" ? "text-yellow-400" :
              "text-muted-foreground/70"
            }`}>
              {person.status === "completed" ? "Completed" : person.status === "in-progress" ? "In Progress" : "Planned"}
            </p>
          )}
          {(treeType === "decision" || treeType === "mindmap") && person.value && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{person.value}</p>
          )}
          {person.notes && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center justify-center gap-0.5 italic">
              <StickyNoteIcon className="h-2.5 w-2.5" />
              {person.notes}
            </p>
          )}
          {person.children.length > 0 && !isRoot && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {person.children.length} {person.children.length === 1 ? "child" : "children"}
            </p>
          )}
          {isEditable && (
            <div className="flex items-center justify-center gap-0.5 mt-2 opacity-60 hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEditPerson(true)} title="Edit">
                <PencilIcon className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddChild(true)} title="Add child">
                <PlusIcon className="h-3 w-3" />
              </Button>
              {treeType === "family" && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddSpouse(true)} title="Add spouse">
                  <HeartIcon className="h-3 w-3" />
                </Button>
              )}
              {!isRoot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                  title="Remove"
                >
                  <Trash2Icon className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Spouses — family tree only */}
        {treeType === "family" && person.spouses.map((spouse) => {
          const spouseYears = formatYears(spouse.birthYear, spouse.deathYear);
          return (
            <div key={spouse.id} className="flex items-center gap-2">
              <HeartIcon className="h-3.5 w-3.5 text-pink-400/70 shrink-0" />
              <div
                className={`rounded-xl border px-4 py-2.5 text-center shadow-md backdrop-blur-sm min-w-[130px] transition-all hover:shadow-lg ${getCardStyle(treeType, spouse as unknown as PersonNode)}`}
              >
                <p className={`font-semibold text-[13px] tracking-wide ${getNameColor(treeType, spouse as unknown as PersonNode)}`}>
                  {spouse.name}
                </p>
                {spouseYears && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {spouseYears}
                  </p>
                )}
                {spouse.birthplace && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center justify-center gap-0.5">
                    <MapPinIcon className="h-2.5 w-2.5" />
                    {spouse.birthplace}
                  </p>
                )}
                {isEditable && (
                  <div className="flex items-center justify-center gap-0.5 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingSpouse(spouse)} title="Edit spouse">
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setConfirmDeleteSpouse(spouse.id)}
                      title="Remove spouse"
                    >
                      <Trash2Icon className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs — only render when open */}
      {showAddChild && (
        <PersonForm
          open
          treeType={treeType}
          onOpenChange={setShowAddChild}
          title={`Add ${treeType === "family" ? "child" : "node"} under ${person.name}`}
          onSubmit={(data) => onAddChild(person.id, data)}
        />
      )}
      {showEditPerson && (
        <PersonForm
          open
          treeType={treeType}
          onOpenChange={setShowEditPerson}
          title={`Edit ${person.name}`}
          initialData={person}
          onSubmit={(data) => onEditPerson(person.id, data)}
        />
      )}
      {showAddSpouse && (
        <PersonForm
          open
          treeType={treeType}
          onOpenChange={setShowAddSpouse}
          title={`Add spouse of ${person.name}`}
          onSubmit={(data) => onAddSpouse(person.id, data)}
        />
      )}
      {editingSpouse && (
        <PersonForm
          open
          treeType={treeType}
          onOpenChange={(open) => { if (!open) setEditingSpouse(null); }}
          title={`Edit ${editingSpouse.name}`}
          initialData={editingSpouse}
          onSubmit={(data) => {
            onEditSpouse(person.id, editingSpouse.id, data);
            setEditingSpouse(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          open
          onOpenChange={setConfirmDelete}
          title={`Delete ${person.name}?`}
          description={(() => {
            const d = countDescendants(person);
            return d > 0
              ? `This will also remove ${d} descendant${d > 1 ? "s" : ""}. This cannot be undone.`
              : "This cannot be undone.";
          })()}
          onConfirm={() => onRemovePerson(person.id)}
        />
      )}
      {confirmDeleteSpouse && (
        <ConfirmDialog
          open
          onOpenChange={(open) => { if (!open) setConfirmDeleteSpouse(null); }}
          title="Remove spouse?"
          description="This cannot be undone."
          onConfirm={() => onRemoveSpouse(person.id, confirmDeleteSpouse)}
        />
      )}
    </>
  );
}
