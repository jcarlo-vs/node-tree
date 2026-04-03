"use client";

import type { PersonNode } from "@/lib/types/tree";
import { PersonCard } from "./person-card";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

const LINE_COLORS = [
  "var(--tree-line-0)",
  "var(--tree-line-1)",
  "var(--tree-line-2)",
  "var(--tree-line-3)",
  "var(--tree-line-4)",
  "var(--tree-line-5)",
];

function getLineColor(depth: number) {
  return LINE_COLORS[depth % LINE_COLORS.length];
}

type TreeViewProps = {
  person: PersonNode;
  isEditable: boolean;
  isRoot?: boolean;
  depth?: number;
  highlightId?: string | null;
  onAddChild: (parentId: string, data: Record<string, unknown>) => void;
  onEditPerson: (nodeId: string, data: Record<string, unknown>) => void;
  onRemovePerson: (nodeId: string) => void;
  onAddSpouse: (nodeId: string, data: Record<string, unknown>) => void;
  onEditSpouse: (nodeId: string, spouseId: string, data: Record<string, unknown>) => void;
  onRemoveSpouse: (nodeId: string, spouseId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
};

export function TreeView({
  person,
  isEditable,
  isRoot = false,
  depth = 0,
  highlightId,
  onAddChild,
  onEditPerson,
  onRemovePerson,
  onAddSpouse,
  onEditSpouse,
  onRemoveSpouse,
  onToggleCollapse,
}: TreeViewProps) {
  const hasChildren = person.children.length > 0;
  const color = getLineColor(depth);
  const multipleChildren = person.children.length > 1;
  const isHighlighted = highlightId === person.id;

  return (
    <div
      className={`flex flex-col items-center transition-all duration-300 tree-node-animate ${
        isHighlighted ? "ring-2 ring-yellow-400/60 rounded-2xl p-2" : ""
      }`}
      data-node-id={person.id}
    >
      <PersonCard
        person={person}
        isEditable={isEditable}
        isRoot={isRoot}
        onAddChild={onAddChild}
        onEditPerson={onEditPerson}
        onRemovePerson={onRemovePerson}
        onAddSpouse={onAddSpouse}
        onEditSpouse={onEditSpouse}
        onRemoveSpouse={onRemoveSpouse}
      />

      {/* Collapse/expand toggle */}
      {hasChildren && (
        <>
          <div className="flex flex-col items-center">
            <div
              className="tree-line tree-line-v"
              style={{ background: color, height: 14 }}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-5 w-5 rounded-full border-border/50 bg-card/80 backdrop-blur-sm z-10"
              onClick={() => onToggleCollapse(person.id)}
              title={person.collapsed ? "Expand" : "Collapse"}
            >
              {person.collapsed ? (
                <ChevronRightIcon className="h-3 w-3" />
              ) : (
                <ChevronDownIcon className="h-3 w-3" />
              )}
            </Button>
            {!person.collapsed && (
              <div
                className="tree-line tree-line-v"
                style={{ background: color, height: 14 }}
              />
            )}
          </div>

          {/* Children row */}
          {!person.collapsed && (
            <div className="flex items-start gap-0">
              {person.children.map((child, i) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="flex items-start w-full">
                    <div
                      className="tree-line tree-line-h flex-1"
                      style={{
                        background:
                          multipleChildren && i > 0 ? color : "transparent",
                      }}
                    />
                    <div
                      className="tree-line tree-line-v"
                      style={{ background: color }}
                    />
                    <div
                      className="tree-line tree-line-h flex-1"
                      style={{
                        background:
                          multipleChildren && i < person.children.length - 1
                            ? color
                            : "transparent",
                      }}
                    />
                  </div>
                  <div className="px-4 pt-1">
                    <TreeView
                      person={child}
                      isEditable={isEditable}
                      depth={depth + 1}
                      highlightId={highlightId}
                      onAddChild={onAddChild}
                      onEditPerson={onEditPerson}
                      onRemovePerson={onRemovePerson}
                      onAddSpouse={onAddSpouse}
                      onEditSpouse={onEditSpouse}
                      onRemoveSpouse={onRemoveSpouse}
                      onToggleCollapse={onToggleCollapse}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collapsed indicator */}
          {person.collapsed && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {person.children.length} hidden
            </p>
          )}
        </>
      )}
    </div>
  );
}
