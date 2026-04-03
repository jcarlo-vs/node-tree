"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, MinusIcon, LocateFixedIcon, MaximizeIcon } from "lucide-react";

type TreeCanvasProps = {
  children: ReactNode;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
};

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

function isInteractiveElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
  if (el.closest("button, a, input, select, textarea, [role='button'], [data-slot='dialog-content']")) return true;
  return false;
}

export function TreeCanvas({ children, onUndo, onRedo, onSearch }: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerRect = container.getBoundingClientRect();
    const contentRect = content.children[0]?.getBoundingClientRect();
    if (!contentRect || contentRect.width === 0) return;

    // Calculate the actual content size at zoom=1
    const actualWidth = contentRect.width / zoom;
    const actualHeight = contentRect.height / zoom;

    const padX = 80;
    const padY = 80;
    const scaleX = (containerRect.width - padX) / actualWidth;
    const scaleY = (containerRect.height - padY) / actualHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_ZOOM), MAX_ZOOM);

    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  }, [zoom]);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        onRedo?.();
      } else if (mod && e.key === "y") {
        e.preventDefault();
        onRedo?.();
      } else if (mod && e.key === "f") {
        e.preventDefault();
        onSearch?.();
      } else if (e.key === "Escape") {
        // Escape is handled by dialog components
      } else if (e.key === "=" || e.key === "+") {
        if (mod) { e.preventDefault(); zoomIn(); }
      } else if (e.key === "-") {
        if (mod) { e.preventDefault(); zoomOut(); }
      } else if (e.key === "0") {
        if (mod) { e.preventDefault(); resetView(); }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo, onSearch, zoomIn, zoomOut, resetView]);

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    }

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Mouse drag to pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  useEffect(() => {
    if (!isPanning) return;

    function handleMouseMove(e: MouseEvent) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({
        x: panStart.current.panX + dx,
        y: panStart.current.panY + dy,
      });
    }

    function handleMouseUp() {
      setIsPanning(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning]);

  // Touch support
  const touchStart = useRef<{ x: number; y: number; panX: number; panY: number; dist: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isInteractiveElement(e.target)) return;
      if (e.touches.length === 1) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y, dist: 0 };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        touchStart.current = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2, panX: pan.x, panY: pan.y, dist };
      }
    },
    [pan]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    if (e.touches.length === 1) {
      setPan({ x: touchStart.current.panX + e.touches[0].clientX - touchStart.current.x, y: touchStart.current.panY + e.touches[0].clientY - touchStart.current.y });
    } else if (e.touches.length === 2 && touchStart.current.dist > 0) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (dist / touchStart.current!.dist))));
      touchStart.current.dist = dist;
    }
  }, []);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="relative flex-1 overflow-hidden canvas-dots">
      {/* Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div
          ref={contentRef}
          className="w-full h-full flex items-start justify-center pt-12"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top center",
            transition: isPanning ? "none" : "transform 0.2s ease-out",
          }}
        >
          {children}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1.5 z-10">
        <div className="flex flex-col bg-card/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={zoomIn} title="Zoom in (Ctrl +)">
            <PlusIcon className="h-4 w-4" />
          </Button>
          <div className="text-[10px] text-center text-muted-foreground py-0.5 border-y border-border/30 select-none">
            {zoomPercent}%
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none" onClick={zoomOut} title="Zoom out (Ctrl -)">
            <MinusIcon className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-card/80 backdrop-blur-md border-border/50 shadow-lg text-xs"
          onClick={fitToScreen}
          title="Fit to screen"
        >
          <MaximizeIcon className="h-3.5 w-3.5" />
          Fit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-card/80 backdrop-blur-md border-border/50 shadow-lg text-xs"
          onClick={resetView}
          title="Reset view (Ctrl 0)"
        >
          <LocateFixedIcon className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
