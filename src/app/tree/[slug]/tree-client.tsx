"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { FamilyTreeData, PersonBase, PersonNode, Spouse, TreeType } from "@/lib/types/tree";
import { TreeView, type NodeIntent } from "@/components/tree/tree-view";
import { ConfirmDialog } from "@/components/tree/confirm-dialog";
import { NodeInspector } from "@/components/tree/node-inspector";
import { TreeCanvas } from "@/components/tree/tree-canvas";
import { ShareDialog } from "@/components/tree/share-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addChild,
  removeNode,
  updateNode,
  addSpouse,
  updateSpouse,
  removeSpouse,
  toggleCollapse,
  createPerson,
  findNode,
  findParent,
  findSpouseOwner,
  countDescendants,
  migrateTree,
  searchTree,
} from "@/lib/tree-utils";
import { updateTree } from "@/lib/actions/tree";
import {
  ShareIcon,
  Undo2Icon,
  Redo2Icon,
  SearchIcon,
  DownloadIcon,
  XIcon,
  PanelLeftIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

type TreeClientProps = {
  slug: string;
  name: string;
  treeType: TreeType;
  initialTreeData: FamilyTreeData;
  isEditable: boolean;
  editToken?: string;
};

const MAX_HISTORY = 50;

export function TreeClient({
  slug,
  name,
  treeType,
  initialTreeData,
  isEditable,
  editToken,
}: TreeClientProps) {
  const [initialMigrated] = useState<FamilyTreeData>(() => migrateTree(initialTreeData));
  const [treeData, setTreeData] = useState<FamilyTreeData>(initialMigrated);
  const [history, setHistory] = useState<FamilyTreeData[]>([initialMigrated]);
  const historyIndexRef = useRef(0);
  const historyRef = useRef<FamilyTreeData[]>([initialMigrated]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [intent, setIntent] = useState<NodeIntent | null>(null);
  const [namingId, setNamingId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const liveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const liveRef = useRef<FamilyTreeData | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keep refs in sync
  historyIndexRef.current = historyIndex;
  historyRef.current = history;

  const persistToServer = useCallback(
    (tree: FamilyTreeData) => {
      if (editToken) updateTree(slug, editToken, tree).catch(console.error);
    },
    [slug, editToken]
  );

  const save = useCallback(
    async (newTree: FamilyTreeData, message?: string) => {
      setTreeData(newTree);

      const idx = historyIndexRef.current;
      const trimmed = historyRef.current.slice(0, idx + 1);
      const next = [...trimmed, newTree];
      if (next.length > MAX_HISTORY) next.shift();
      setHistory(next);
      historyRef.current = next;

      const newIdx = Math.min(idx + 1, MAX_HISTORY - 1);
      setHistoryIndex(newIdx);
      historyIndexRef.current = newIdx;

      if (message) toast.success(message);

      if (!editToken) return;
      setSaving(true);
      try {
        await updateTree(slug, editToken, newTree);
      } catch (e) {
        console.error("Failed to save:", e);
        toast.error("Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [slug, editToken]
  );

  /**
   * Live edits: the canvas updates on every keystroke, but the server write and
   * the history entry are debounced, so typing a name is one undo step, not ten.
   */
  const saveLive = useCallback(
    (tree: FamilyTreeData) => {
      setTreeData(tree);
      liveRef.current = tree;
      clearTimeout(liveTimer.current);
      liveTimer.current = setTimeout(() => {
        const latest = liveRef.current;
        if (!latest) return;
        liveRef.current = null;

        const idx = historyIndexRef.current;
        const next = [...historyRef.current.slice(0, idx + 1), latest];
        if (next.length > MAX_HISTORY) next.shift();
        setHistory(next);
        historyRef.current = next;
        const newIdx = Math.min(idx + 1, MAX_HISTORY - 1);
        setHistoryIndex(newIdx);
        historyIndexRef.current = newIdx;

        if (!editToken) return;
        setSaving(true);
        updateTree(slug, editToken, latest)
          .then(() => setSaveError(false))
          .catch(() => setSaveError(true))
          .finally(() => setSaving(false));
      }, 600);
    },
    [slug, editToken]
  );

  /** Re-send whatever is on screen now. */
  const retrySave = useCallback(() => {
    if (!editToken) return;
    setSaving(true);
    updateTree(slug, editToken, treeData)
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true))
      .finally(() => setSaving(false));
  }, [slug, editToken, treeData]);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    const newIndex = idx - 1;
    const prev = historyRef.current[newIndex];
    setHistoryIndex(newIndex);
    historyIndexRef.current = newIndex;
    setTreeData(prev);
    toast("Undo");
    persistToServer(prev);
  }, [persistToServer]);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx >= historyRef.current.length - 1) return;
    const newIndex = idx + 1;
    const next = historyRef.current[newIndex];
    setHistoryIndex(newIndex);
    historyIndexRef.current = newIndex;
    setTreeData(next);
    toast("Redo");
    persistToServer(next);
  }, [persistToServer]);

  const toggleSearch = useCallback(() => {
    setShowSearch((v) => !v);
  }, []);

  /** + puts a real node on the board immediately, then focuses its label. */
  function handleAddChild(parentId: string) {
    const person = createPerson("");
    save(addChild(treeData, parentId, person));
    setSelectedId(person.id);
    setNamingId(person.id);
  }

  function handleAddSpouse(nodeId: string) {
    const spouse: Spouse = { id: crypto.randomUUID(), name: "" };
    save(addSpouse(treeData, nodeId, spouse));
    setNamingId(spouse.id);
  }

  /** Typing in a node label, or in the inspector's name field. */
  function handleNameChange(id: string, name: string) {
    const owner = findSpouseOwner(treeData.root, id);
    saveLive(
      owner
        ? updateSpouse(treeData, owner.id, id, { name })
        : updateNode(treeData, id, { name })
    );
  }

  function handleNameCommit(id: string, next: "sibling" | "done" | "cancel") {
    setNamingId(null);

    const owner = findSpouseOwner(treeData.root, id);
    const named = owner
      ? owner.spouses.find((sp) => sp.id === id)?.name.trim()
      : findNode(treeData.root, id)?.name.trim();

    // Escape on a node you never named discards it. Clicking away does not —
    // you may well be on your way to the inspector to name it there.
    if (next === "cancel" && !named) {
      save(owner ? removeSpouse(treeData, owner.id, id) : removeNode(treeData, id));
      setSelectedId(owner ? owner.id : null);
      return;
    }

    if (next === "sibling" && named && !owner) {
      const parent = findParent(treeData.root, id);
      if (parent) handleAddChild(parent.id);
    }
  }

  function handleInspectorChange(patch: Partial<PersonBase>) {
    if (!selectedId) return;
    const owner = findSpouseOwner(treeData.root, selectedId);
    saveLive(
      owner
        ? updateSpouse(treeData, owner.id, selectedId, patch)
        : updateNode(treeData, selectedId, patch as Parameters<typeof updateNode>[2])
    );
  }

  function handleRemovePerson(nodeId: string) {
    save(removeNode(treeData, nodeId), "Removed");
    setSelectedId(null);
  }

  function handleRemoveSpouse(nodeId: string, spouseId: string) {
    save(removeSpouse(treeData, nodeId, spouseId), "Removed");
    setSelectedId(null);
  }

  /** The canvas toolbar asks for things; only deletes become a dialog. */
  function handleIntent(i: NodeIntent) {
    switch (i.kind) {
      case "add-child":
        handleAddChild(i.nodeId);
        break;
      case "add-spouse":
        handleAddSpouse(i.nodeId);
        break;
      case "edit":
        setSelectedId(i.nodeId);
        setNamingId(i.nodeId);
        break;
      case "edit-spouse":
        setNamingId(null);
        setSelectedId(i.spouseId);
        break;
      default:
        setIntent(i);
    }
  }

  function handleToggleCollapse(nodeId: string) {
    const newTree = toggleCollapse(treeData, nodeId);
    setTreeData(newTree);
  }

  // Search
  const searchResults = useMemo(
    () => searchQuery.trim() ? searchTree(treeData.root, searchQuery.trim()) : [],
    [searchQuery, treeData]
  );

  function handleSearchSelect(nodeId: string) {
    setHighlightId(nodeId);
    setShowSearch(false);
    setSearchQuery("");
    clearTimeout(highlightTimer.current);
    setTimeout(() => {
      const el = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 100);
    highlightTimer.current = setTimeout(() => setHighlightId(null), 3000);
  }

  // Export — hides edit controls and skips cross-origin stylesheets
  async function handleExport() {
    if (!treeRef.current) return;
    setExporting(true);
    toast.loading("Exporting...");

    // Wait for React to re-render with exporting=true (hides edit buttons)
    await new Promise((r) => setTimeout(r, 100));

    try {
      const dataUrl = await toPng(treeRef.current, {
        backgroundColor: "#1a1a1a",
        pixelRatio: 2,
        skipFonts: true,
        filter: (node: HTMLElement) => {
          // Skip cross-origin link elements that cause cssRules errors
          if (node.tagName === "LINK" && node.getAttribute("href")?.includes("fontshare")) {
            return false;
          }
          return true;
        },
      });
      const link = document.createElement("a");
      link.download = `${name}-${treeType}.png`;
      link.href = dataUrl;
      link.click();
      toast.dismiss();
      toast.success("Exported!");
    } catch (e) {
      console.error("Export failed:", e);
      toast.dismiss();
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const selectedSpouseOwner = selectedId ? findSpouseOwner(treeData.root, selectedId) : null;
  const selectedPerson: (PersonBase & { id: string }) | null = selectedId
    ? selectedSpouseOwner
      ? selectedSpouseOwner.spouses.find((sp) => sp.id === selectedId) ?? null
      : findNode(treeData.root, selectedId)
    : null;

  const isEmpty = treeData.root.children.length === 0 && treeData.root.spouses.length === 0;


  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/80 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-2xl tracking-tight">{name}</h1>
          {!isEditable && (
            <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
              View only
            </span>
          )}
          {saving && (
            <span className="text-[11px] text-muted-foreground animate-pulse">
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isEditable && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                <Undo2Icon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
                <Redo2Icon className="h-4 w-4" />
              </Button>
              <div className="w-px h-5 bg-border/50 mx-1" />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowPanel((v) => !v)}
            title={showPanel ? "Hide inspector" : "Show inspector"}
            aria-pressed={showPanel}
          >
            <PanelLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSearch} title="Search (Ctrl+F)">
            <SearchIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} title="Export as image">
            <DownloadIcon className="h-4 w-4" />
          </Button>
          {editToken && (
            <>
              <div className="w-px h-5 bg-border/50 mx-1" />
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                <ShareIcon className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="border-b border-border/50 px-6 py-2 bg-background/90 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2 max-w-md">
            <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="h-8 text-sm"
              autoFocus
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          {searchQuery.trim() && (
            <div className="mt-2 flex flex-wrap gap-1.5 pb-1">
              {searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground">No results</p>
              )}
              {searchResults.map((result, i) => (
                <button
                  key={`${result.nodeId}-${i}`}
                  onClick={() => handleSearchSelect(result.nodeId)}
                  className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1 rounded-md transition-colors"
                >
                  {result.label}
                  {result.sublabel && (
                    <span className="text-muted-foreground ml-1">({result.sublabel})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inspector + canvas */}
      <div className="flex flex-1 min-h-0">
        {showPanel && (
          <NodeInspector
            person={selectedPerson}
            treeType={treeType}
            isEditable={isEditable}
            isRoot={selectedId === treeData.root.id}
            isSpouse={!!selectedSpouseOwner}
            saveState={saveError ? "error" : saving ? "saving" : "idle"}
            onChange={handleInspectorChange}
            onAddChild={() => selectedId && handleAddChild(selectedId)}
            onAddSpouse={() => selectedId && handleAddSpouse(selectedId)}
            onDelete={() =>
              selectedId &&
              setIntent(
                selectedSpouseOwner
                  ? { kind: "delete-spouse", nodeId: selectedSpouseOwner.id, spouseId: selectedId }
                  : { kind: "delete", nodeId: selectedId }
              )
            }
            onClose={() => setSelectedId(null)}
            onRetry={retrySave}
          />
        )}

      <TreeCanvas onUndo={isEditable ? undo : undefined} onRedo={isEditable ? redo : undefined} onSearch={toggleSearch}>
        <div ref={treeRef}>
          <TreeView
            root={treeData.root}
            treeType={treeType}
            isEditable={isEditable && !exporting}
            selectedId={exporting ? null : selectedId}
            highlightId={highlightId}
            namingId={exporting ? null : namingId}
            onSelect={(id) => { setNamingId(null); setSelectedId(id); }}
            onNameChange={handleNameChange}
            onNameCommit={handleNameCommit}
            onToggleCollapse={handleToggleCollapse}
            onIntent={handleIntent}
          />

          {/* Empty state */}
          {isEmpty && isEditable && (
            <div className="text-center mt-8 text-muted-foreground">
              <p className="text-sm">
                {treeType === "family" ? "Start building your family tree" :
                 treeType === "org" ? "Start building your org chart" :
                 treeType === "mindmap" ? "Start mapping your ideas" :
                 treeType === "skill" ? "Start building your skill tree" :
                 "Start building your decision tree"}
              </p>
              <p className="text-xs mt-1">
                {isEditable
                  ? "Select the node above, then use the + button"
                  : "Nothing here yet"}
              </p>
            </div>
          )}
        </div>
      </TreeCanvas>
      </div>

      {intent && (intent.kind === "delete" || intent.kind === "delete-spouse") && (
        <DeleteConfirm
          intent={intent}
          root={treeData.root}
          onClose={() => setIntent(null)}
          onRemovePerson={handleRemovePerson}
          onRemoveSpouse={handleRemoveSpouse}
        />
      )}

      {/* Share Dialog */}
      {editToken && (
        <ShareDialog
          open={showShare}
          onOpenChange={setShowShare}
          slug={slug}
          editToken={editToken}
        />
      )}
    </div>
  );
}

type DeleteIntent = Extract<NodeIntent, { kind: "delete" } | { kind: "delete-spouse" }>;

/** Only destructive actions still interrupt you. Everything else is the inspector. */
function DeleteConfirm({
  intent, root, onClose, onRemovePerson, onRemoveSpouse,
}: {
  intent: DeleteIntent;
  root: PersonNode;
  onClose: () => void;
  onRemovePerson: (nodeId: string) => void;
  onRemoveSpouse: (nodeId: string, spouseId: string) => void;
}) {
  const node = findNode(root, intent.nodeId);
  if (!node) return null;
  const close = (open: boolean) => { if (!open) onClose(); };

  if (intent.kind === "delete-spouse") {
    const spouse = node.spouses.find((sp) => sp.id === intent.spouseId);
    if (!spouse) return null;
    return (
      <ConfirmDialog
        open
        onOpenChange={close}
        title={`Remove ${spouse.name || "this partner"}?`}
        description="This cannot be undone."
        onConfirm={() => onRemoveSpouse(node.id, spouse.id)}
      />
    );
  }

  const d = countDescendants(node);
  return (
    <ConfirmDialog
      open
      onOpenChange={close}
      title={`Delete ${node.name || "this node"}?`}
      description={
        d > 0
          ? `This will also remove ${d} descendant${d > 1 ? "s" : ""}. This cannot be undone.`
          : "This cannot be undone."
      }
      onConfirm={() => onRemovePerson(node.id)}
    />
  );
}
