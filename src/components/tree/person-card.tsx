"use client";

import { useState } from "react";
import type { PersonNode, Spouse } from "@/lib/types/tree";
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
  isEditable: boolean;
  isRoot?: boolean;
  onAddChild: (parentId: string, data: Record<string, unknown>) => void;
  onEditPerson: (nodeId: string, data: Record<string, unknown>) => void;
  onRemovePerson: (nodeId: string) => void;
  onAddSpouse: (nodeId: string, data: Record<string, unknown>) => void;
  onEditSpouse: (nodeId: string, spouseId: string, data: Record<string, unknown>) => void;
  onRemoveSpouse: (nodeId: string, spouseId: string) => void;
};

function getCardStyle(gender?: string) {
  if (gender === "male") return "border-blue-500/30 bg-blue-500/10 text-blue-100";
  if (gender === "female") return "border-pink-500/30 bg-pink-500/10 text-pink-100";
  return "border-border bg-card text-card-foreground";
}

function getNameColor(gender?: string) {
  if (gender === "male") return "text-blue-200";
  if (gender === "female") return "text-pink-200";
  return "text-foreground";
}

function formatYears(birth?: number, death?: number) {
  if (!birth && !death) return null;
  return `${birth ?? "?"} \u2013 ${death ?? "present"}`;
}

export function PersonCard({
  person,
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
        <div
          className={`rounded-xl border text-center shadow-md backdrop-blur-sm transition-all hover:shadow-lg ${
            isRoot
              ? "px-12 py-6 min-w-[260px] border-2 shadow-xl rounded-2xl"
              : "px-4 py-2.5 min-w-[130px]"
          } ${getCardStyle(person.gender)}`}
        >
          <p
            className={`font-semibold tracking-wide ${
              isRoot ? "text-xl" : "text-[13px]"
            } ${getNameColor(person.gender)}`}
          >
            {person.name}
          </p>
          {personYears && (
            <p className={`text-muted-foreground ${isRoot ? "text-sm mt-1.5" : "text-[11px] mt-0.5"}`}>
              {personYears}
            </p>
          )}
          {person.birthplace && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center justify-center gap-0.5">
              <MapPinIcon className="h-2.5 w-2.5" />
              {person.birthplace}
            </p>
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
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddSpouse(true)} title="Add spouse">
                <HeartIcon className="h-3 w-3" />
              </Button>
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

        {/* Spouses */}
        {person.spouses.map((spouse) => {
          const spouseYears = formatYears(spouse.birthYear, spouse.deathYear);
          return (
            <div key={spouse.id} className="flex items-center gap-2">
              <HeartIcon className="h-3.5 w-3.5 text-pink-400/70 shrink-0" />
              <div
                className={`rounded-xl border px-4 py-2.5 text-center shadow-md backdrop-blur-sm min-w-[130px] transition-all hover:shadow-lg ${getCardStyle(spouse.gender)}`}
              >
                <p className={`font-semibold text-[13px] tracking-wide ${getNameColor(spouse.gender)}`}>
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
          onOpenChange={setShowAddChild}
          title={`Add child of ${person.name}`}
          onSubmit={(data) => onAddChild(person.id, data)}
        />
      )}
      {showEditPerson && (
        <PersonForm
          open
          onOpenChange={setShowEditPerson}
          title={`Edit ${person.name}`}
          initialData={person}
          onSubmit={(data) => onEditPerson(person.id, data)}
        />
      )}
      {showAddSpouse && (
        <PersonForm
          open
          onOpenChange={setShowAddSpouse}
          title={`Add spouse of ${person.name}`}
          onSubmit={(data) => onAddSpouse(person.id, data)}
        />
      )}
      {editingSpouse && (
        <PersonForm
          open
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
