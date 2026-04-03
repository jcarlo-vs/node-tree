"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { FamilyTreeData, Spouse } from "@/lib/types/tree";
import { TreeView } from "@/components/tree/tree-view";
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
  reorderChildren,
  toggleCollapse,
  createPerson,
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
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

type TreeClientProps = {
  slug: string;
  name: string;
  initialTreeData: FamilyTreeData;
  isEditable: boolean;
  editToken?: string;
};

const MAX_HISTORY = 50;

export function TreeClient({
  slug,
  name,
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

  function handleAddChild(parentId: string, data: Record<string, unknown>) {
    const person = createPerson(data.name as string);
    person.birthYear = data.birthYear as number | undefined;
    person.deathYear = data.deathYear as number | undefined;
    person.gender = data.gender as "male" | "female" | "other" | undefined;
    person.birthplace = data.birthplace as string | undefined;
    person.notes = data.notes as string | undefined;
    save(addChild(treeData, parentId, person), `Added ${data.name}`);
  }

  function handleEditPerson(nodeId: string, data: Record<string, unknown>) {
    save(updateNode(treeData, nodeId, data as Parameters<typeof updateNode>[2]), "Saved");
  }

  function handleRemovePerson(nodeId: string) {
    save(removeNode(treeData, nodeId), "Removed");
  }

  function handleAddSpouse(nodeId: string, data: Record<string, unknown>) {
    const spouse: Spouse = {
      id: crypto.randomUUID(),
      name: data.name as string,
      birthYear: data.birthYear as number | undefined,
      deathYear: data.deathYear as number | undefined,
      gender: data.gender as "male" | "female" | "other" | undefined,
      birthplace: data.birthplace as string | undefined,
      notes: data.notes as string | undefined,
    };
    save(addSpouse(treeData, nodeId, spouse), `Added ${data.name}`);
  }

  function handleEditSpouse(nodeId: string, spouseId: string, data: Record<string, unknown>) {
    save(updateSpouse(treeData, nodeId, spouseId, data as Parameters<typeof updateSpouse>[3]), "Saved");
  }

  function handleRemoveSpouse(nodeId: string, spouseId: string) {
    save(removeSpouse(treeData, nodeId, spouseId), "Removed");
  }

  function handleReorderChildren(parentId: string, fromIndex: number, toIndex: number) {
    save(reorderChildren(treeData, parentId, fromIndex, toIndex), "Reordered");
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
      link.download = `${name}-family-tree.png`;
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

      {/* Canvas */}
      <TreeCanvas onUndo={isEditable ? undo : undefined} onRedo={isEditable ? redo : undefined} onSearch={toggleSearch}>
        <div ref={treeRef}>
          <TreeView
            person={treeData.root}
            isEditable={isEditable && !exporting}
            isRoot
            highlightId={highlightId}
            onAddChild={handleAddChild}
            onEditPerson={handleEditPerson}
            onRemovePerson={handleRemovePerson}
            onAddSpouse={handleAddSpouse}
            onEditSpouse={handleEditSpouse}
            onRemoveSpouse={handleRemoveSpouse}
            onToggleCollapse={handleToggleCollapse}
            onReorderChildren={handleReorderChildren}
          />

          {/* Empty state */}
          {isEmpty && isEditable && (
            <div className="text-center mt-8 text-muted-foreground">
              <p className="text-sm">Start building your family tree</p>
              <p className="text-xs mt-1">Click the icons above to add a spouse or children</p>
            </div>
          )}
        </div>
      </TreeCanvas>

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
