"use client";

import { useMemo } from "react";
import type { PersonNode, TreeType } from "@/lib/types/tree";
import { layoutTree, connectorPath, NODE_W, type LaidNode } from "@/lib/tree-layout";
import { NodeCard, hueFor, cardHeight, BRANCH_HUES } from "./person-card";
import {
  PlusIcon, PencilIcon, HeartIcon, Trash2Icon,
  ChevronDownIcon, ChevronRightIcon,
} from "lucide-react";

export type NodeIntent =
  | { kind: "add-child"; nodeId: string }
  | { kind: "edit"; nodeId: string }
  | { kind: "add-spouse"; nodeId: string }
  | { kind: "delete"; nodeId: string }
  | { kind: "edit-spouse"; nodeId: string; spouseId: string }
  | { kind: "delete-spouse"; nodeId: string; spouseId: string };

type Props = {
  root: PersonNode;
  treeType: TreeType;
  isEditable: boolean;
  selectedId: string | null;
  highlightId?: string | null;
  /** id of the node being named in place, if any */
  namingId?: string | null;
  onSelect: (nodeId: string | null) => void;
  onNameChange: (nodeId: string, name: string) => void;
  onNameCommit: (nodeId: string, next: "sibling" | "done" | "cancel") => void;
  onToggleCollapse: (nodeId: string) => void;
  onIntent: (intent: NodeIntent) => void;
};

/** Stable branch hue, so a branch keeps its colour as the tree grows. */
function branchHue(root: PersonNode, branchId: string) {
  if (branchId === root.id) return BRANCH_HUES[0];
  const i = root.children.findIndex((c) => c.id === branchId);
  return BRANCH_HUES[(i < 0 ? 0 : i) % BRANCH_HUES.length];
}

export function TreeView({
  root, treeType, isEditable, selectedId, highlightId, namingId,
  onSelect, onNameChange, onNameCommit, onToggleCollapse, onIntent,
}: Props) {
  const showPartners = treeType === "family";
  const L = useMemo(
    () =>
      layoutTree(root, {
        showPartners,
        // a couple shares one height, so the pair lines up
        heightOf: (node, depth) =>
          Math.max(
            cardHeight(node, treeType, depth === 0),
            ...(showPartners ? node.spouses.map((sp) => cardHeight(sp, treeType, false)) : [])
          ),
      }),
    [root, showPartners, treeType]
  );

  const selected = selectedId ? L.byId.get(selectedId) : null;

  return (
    <div
      className="relative"
      style={{ width: L.width, height: L.height }}
      onClick={() => onSelect(null)}
    >
      {/* connectors */}
      <svg
        width={L.width}
        height={L.height}
        className="absolute inset-0 pointer-events-none overflow-visible"
      >
        {L.edges.map((e) => {
          const hue = branchHue(root, e.to.branch);
          return (
            <path
              key={e.id}
              d={connectorPath(e.from, e.to)}
              fill="none"
              stroke={`oklch(0.72 0.15 ${hue} / 0.45)`}
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {L.nodes.map((n) => (
        <NodeGroup
          key={n.id}
          laid={n}
          root={root}
          treeType={treeType}
          isEditable={isEditable}
          isSelected={selectedId === n.id}
          isHighlighted={highlightId === n.id}
          isNaming={namingId === n.id}
          namingSpouse={namingId ?? null}
          onSelect={onSelect}
          onNameChange={onNameChange}
          onNameCommit={onNameCommit}
          onToggleCollapse={onToggleCollapse}
          onIntent={onIntent}
        />
      ))}

      {/* one toolbar, on the selected node — not four buttons on every card */}
      {isEditable && selected && !namingId && (
        <div
          className="absolute z-20 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-0.5 shadow-xl"
          style={{
            left: selected.x,
            top: selected.y - 10,
            transform: "translate(-50%, -100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ToolButton label="Add child" onClick={() => onIntent({ kind: "add-child", nodeId: selected.id })}>
            <PlusIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label="Edit" onClick={() => onIntent({ kind: "edit", nodeId: selected.id })}>
            <PencilIcon className="h-3.5 w-3.5" />
          </ToolButton>
          {treeType === "family" && (
            <ToolButton label="Add partner" onClick={() => onIntent({ kind: "add-spouse", nodeId: selected.id })}>
              <HeartIcon className="h-3.5 w-3.5" />
            </ToolButton>
          )}
          {selected.depth > 0 && (
            <ToolButton
              label="Delete"
              destructive
              onClick={() => onIntent({ kind: "delete", nodeId: selected.id })}
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </ToolButton>
          )}
        </div>
      )}
    </div>
  );
}

function ToolButton({
  children, label, onClick, destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-accent ${
        destructive ? "text-destructive hover:bg-destructive/15" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NodeGroup({
  laid, root, treeType, isEditable, isSelected, isHighlighted, isNaming, namingSpouse,
  onSelect, onNameChange, onNameCommit, onToggleCollapse, onIntent,
}: {
  laid: LaidNode;
  root: PersonNode;
  treeType: TreeType;
  isEditable: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isNaming: boolean;
  namingSpouse: string | null;
  onSelect: (id: string | null) => void;
  onNameChange: (nodeId: string, name: string) => void;
  onNameCommit: (nodeId: string, next: "sibling" | "done" | "cancel") => void;
  onToggleCollapse: (id: string) => void;
  onIntent: (i: NodeIntent) => void;
}) {
  const { node } = laid;
  const bh = branchHue(root, laid.branch);
  const left = laid.x - laid.w / 2;
  const partners = treeType === "family" ? node.spouses : [];
  const namingSpouseId = isNaming ? null : namingSpouse;
  const childCount = node.children.length;

  return (
    <div
      className="absolute"
      style={{ left, top: laid.y, width: laid.w, height: laid.h }}
      data-node-id={node.id}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-stretch h-full">
        <NodeCard
          person={node}
          treeType={treeType}
          hue={hueFor(node, treeType, bh)}
          width={laid.personW}
          height={laid.h}
          isRoot={laid.depth === 0}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          isNaming={isNaming}
          onSelect={() => onSelect(isSelected ? null : node.id)}
          onNameChange={(name) => onNameChange(node.id, name)}
          onNameCommit={(next) => onNameCommit(node.id, next)}
        />

        {partners.map((spouse) => (
          <div key={spouse.id} className="flex items-stretch">
            {/* union bar — children hang off the centre of the whole group */}
            <span className="relative w-[30px] shrink-0 flex items-center justify-center">
              <span className="absolute inset-x-0 h-[1.75px]" style={{ background: `oklch(0.72 0.15 ${bh} / 0.45)` }} />
              <HeartIcon className="relative h-3 w-3 text-pink-400/80" />
            </span>
            <div className="relative group/p">
              <NodeCard
                person={spouse}
                treeType={treeType}
                hue={hueFor(spouse, treeType, bh)}
                width={NODE_W}
                height={laid.h}
                isNaming={namingSpouseId === spouse.id}
                onSelect={() => onIntent({ kind: "edit-spouse", nodeId: node.id, spouseId: spouse.id })}
                onNameChange={(name) => onNameChange(spouse.id, name)}
                onNameCommit={(next) => onNameCommit(spouse.id, next)}
              />
              {isEditable && (
                <button
                  type="button"
                  aria-label={`Remove ${spouse.name}`}
                  title={`Remove ${spouse.name}`}
                  onClick={() => onIntent({ kind: "delete-spouse", nodeId: node.id, spouseId: spouse.id })}
                  className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full border border-border bg-popover text-destructive opacity-0 transition-opacity group-hover/p:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2Icon className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* collapse badge, carrying the hidden count */}
      {childCount > 0 && (
        <button
          type="button"
          onClick={() => onToggleCollapse(node.id)}
          title={node.collapsed ? `Expand ${childCount}` : "Collapse"}
          aria-label={node.collapsed ? `Expand ${childCount} children` : "Collapse children"}
          className="absolute z-10 grid h-5 min-w-5 px-1 place-items-center rounded-full border bg-card text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          style={{
            left: laid.w / 2,
            top: laid.h,
            transform: "translate(-50%, -50%)",
            borderColor: `oklch(0.72 0.15 ${bh} / 0.5)`,
          }}
        >
          {node.collapsed ? (
            childCount
          ) : (
            <ChevronDownIcon className="h-3 w-3" />
          )}
          {node.collapsed && <ChevronRightIcon className="h-2.5 w-2.5 -mr-0.5 opacity-60" />}
        </button>
      )}
    </div>
  );
}
