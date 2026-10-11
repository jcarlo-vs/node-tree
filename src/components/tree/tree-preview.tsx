"use client";

import { useEffect, useMemo, useState } from "react";
import type { TreeType } from "@/lib/types/tree";
import { LinkIcon } from "lucide-react";

type Spec = { l: string; s?: string; k?: Spec[] };

/** Hues are per-depth and match the --tree-line-* palette the real canvas draws with. */
const SPECS: Record<TreeType, { name: string; hues: number[]; tree: Spec }> = {
  family: {
    name: "Nemesio Clan",
    hues: [250, 330, 160],
    tree: {
      l: "Nemesio", s: "1921 – 2004",
      k: [
        { l: "Ramon", s: "b. 1948", k: [{ l: "Ana" }, { l: "Paolo" }] },
        { l: "Elena", s: "b. 1951", k: [{ l: "Mia" }] },
        { l: "Tito", s: "b. 1955" },
      ],
    },
  },
  org: {
    name: "Acme Corp",
    hues: [250, 200, 160],
    tree: {
      l: "Chief Exec", s: "founder",
      k: [
        { l: "Engineering", s: "12 people", k: [{ l: "Frontend" }, { l: "Backend" }] },
        { l: "Design", s: "4 people", k: [{ l: "Brand" }] },
        { l: "Sales", s: "6 people" },
      ],
    },
  },
  mindmap: {
    name: "Project Ideas",
    hues: [290, 330, 250],
    tree: {
      l: "Launch Plan", s: "Q1",
      k: [
        { l: "Research", s: "2 weeks", k: [{ l: "Interviews" }, { l: "Survey" }] },
        { l: "Build", s: "6 weeks", k: [{ l: "MVP" }] },
        { l: "Ship", s: "launch day" },
      ],
    },
  },
  skill: {
    name: "Web Dev Roadmap",
    hues: [140, 50, 200],
    tree: {
      l: "Web Dev", s: "in progress",
      k: [
        { l: "JavaScript", s: "done", k: [{ l: "Async" }, { l: "DOM" }] },
        { l: "React", s: "in progress", k: [{ l: "Hooks" }] },
        { l: "Databases", s: "planned" },
      ],
    },
  },
  decision: {
    name: "Career Path",
    hues: [50, 250, 160],
    tree: {
      l: "New offer?", s: "decide by Fri",
      k: [
        { l: "Accept", s: "+ title", k: [{ l: "Relocate" }, { l: "Remote" }] },
        { l: "Negotiate", s: "ask +20%", k: [{ l: "Counter" }] },
        { l: "Decline", s: "stay" },
      ],
    },
  },
};

const RAIL = ["name it", "add branches", "go deeper", "share the link"];

const NODE_W = 108, NODE_H = 40;
const ROOT_W = 168, ROOT_H = 52;
const COL = 130, ROW = 96, PAD = 20;
const STEP_MS = 340;

type LNode = { i: number; label: string; sub?: string; depth: number; x: number; y: number; w: number; h: number };
type LEdge = { from: number; to: number; depth: number; d: string };

function layout(spec: Spec) {
  const nodes: LNode[] = [];
  const edges: LEdge[] = [];
  let cursor = 0;

  function walk(s: Spec, depth: number, parent: number | null): number {
    const isRoot = depth === 0;
    const n: LNode = {
      i: nodes.length, label: s.l, sub: s.s, depth,
      x: 0, y: depth * ROW,
      w: isRoot ? ROOT_W : NODE_W,
      h: isRoot ? ROOT_H : NODE_H,
    };
    nodes.push(n);
    if (parent !== null) edges.push({ from: parent, to: n.i, depth: depth - 1, d: "" });

    const kids = s.k ?? [];
    if (kids.length === 0) {
      n.x = cursor;
      cursor += COL;
    } else {
      const xs = kids.map((k) => walk(k, depth + 1, n.i));
      n.x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    return n.x;
  }
  walk(spec, 0, null);

  for (const e of edges) {
    const p = nodes[e.from];
    const c = nodes[e.to];
    const midY = p.y + p.h + (c.y - p.y - p.h) / 2;
    e.d = `M ${p.x} ${p.y + p.h} V ${midY} H ${c.x} V ${c.y}`;
  }

  // Reveal level by level, left to right — reads like someone building it by hand.
  const order = [...nodes].sort((a, b) => a.depth - b.depth || a.x - b.x);
  const shownAt = new Map(order.map((n, k) => [n.i, k]));
  const depthAt = order.map((n) => n.depth);

  const minX = Math.min(...nodes.map((n) => n.x - n.w / 2));
  const maxX = Math.max(...nodes.map((n) => n.x + n.w / 2));
  const maxY = Math.max(...nodes.map((n) => n.y + n.h));

  return {
    nodes, edges, shownAt, depthAt,
    viewBox: `${minX - PAD} ${-PAD} ${maxX - minX + PAD * 2} ${maxY + PAD * 2}`,
  };
}

const fill = (h: number) => `oklch(0.72 0.15 ${h} / 0.14)`;
const line = (h: number) => `oklch(0.72 0.15 ${h} / 0.5)`;
const ink = (h: number) => `oklch(0.93 0.05 ${h})`;
const dim = (h: number) => `oklch(0.78 0.04 ${h} / 0.62)`;

function cut(s: string, n: number) {
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function slugPreview(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function treeTypeExample(type: TreeType) {
  return SPECS[type].name;
}

type Props = {
  type: TreeType;
  /** Mirrors what the visitor is typing into the root node. */
  name?: string;
};

export function TreePreview({ type, name }: Props) {
  const spec = SPECS[type];
  const L = useMemo(() => layout(spec.tree), [spec]);
  const [step, setStep] = useState(0);

  // Builds once, then stays built — only the pulses keep moving.
  // The parent keys this component by type, so a type switch remounts and rebuilds.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    const tick = setInterval(
      () => {
        i = reduced ? L.nodes.length : i + 1;
        setStep(i);
        if (i >= L.nodes.length) clearInterval(tick);
      },
      reduced ? 0 : STEP_MS
    );
    return () => clearInterval(tick);
  }, [L.nodes.length]);

  const built = step >= L.nodes.length;
  const railStep = built ? 3 : Math.max(0, L.depthAt[step - 1] ?? 0);
  const title = name?.trim() || spec.name;
  const slug = slugPreview(title);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
      {/* Toolbar — mirrors the real editor header */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-border/60 bg-white/[0.02]">
        <p className="text-xs font-semibold truncate">{cut(title, 28)}</p>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground shrink-0 border border-border/60 rounded-md px-2 py-1">
          {built ? (
            <>
              <LinkIcon className="h-2.5 w-2.5" />
              /tree/{cut(slug, 18) || "your-tree"}-…
            </>
          ) : (
            <span className="animate-pulse">building…</span>
          )}
        </span>
      </div>

      {/* Stage */}
      <div className="canvas-dots">
        <svg
          viewBox={L.viewBox}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`A ${spec.name} diagram assembling itself node by node`}
        >
          {L.edges.map((e, i) => {
            const on = step > (L.shownAt.get(e.to) ?? 0);
            const h = spec.hues[e.depth % spec.hues.length];
            const id = `${type}-e${i}`;
            return (
              <g key={id}>
                <path
                  d={e.d}
                  fill="none"
                  stroke={line(h)}
                  strokeWidth={1.75}
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: on ? 0 : 1,
                    transition: "stroke-dashoffset .45s ease-out",
                  }}
                />
                {built && (
                  <>
                    <path id={id} d={e.d} fill="none" stroke="none" />
                    <circle
                      className="tree-pulse"
                      r={2.8}
                      fill={`oklch(0.9 0.17 ${h})`}
                      style={{ color: `oklch(0.9 0.17 ${h})` }}
                    >
                      <animateMotion dur="2.8s" repeatCount="indefinite" begin={`${i * 0.3}s`}>
                        <mpath href={`#${id}`} />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {L.nodes.map((n) => {
            const on = step > (L.shownAt.get(n.i) ?? 0);
            if (!on) return null;
            const h = spec.hues[n.depth % spec.hues.length];
            const isRoot = n.depth === 0;
            const label = isRoot ? title : n.label;
            return (
              <g key={`${type}-n${n.i}`} className="tree-node-animate">
                <rect
                  x={n.x - n.w / 2}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={isRoot ? 13 : 10}
                  fill={fill(h)}
                  stroke={line(h)}
                  strokeWidth={isRoot ? 1.75 : 1.25}
                />
                <text
                  x={n.x}
                  y={n.y + (n.sub ? n.h / 2 - 1 : n.h / 2 + 4)}
                  textAnchor="middle"
                  fill={ink(h)}
                  fontSize={isRoot ? 14 : 11}
                  fontWeight={600}
                >
                  {cut(label, isRoot ? 18 : 13)}
                </text>
                {n.sub && (
                  <text
                    x={n.x}
                    y={n.y + n.h / 2 + (isRoot ? 15 : 12)}
                    textAnchor="middle"
                    fill={dim(h)}
                    fontSize={isRoot ? 10 : 8.5}
                  >
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

      </div>

      {/* Step rail */}
      <div className="flex gap-2 px-3.5 py-3 border-t border-border/60 bg-white/[0.02]">
        {RAIL.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col gap-1.5">
            <span
              className={`text-[9px] font-mono uppercase tracking-wider truncate transition-colors ${
                i <= railStep ? "text-foreground" : "text-muted-foreground/50"
              }`}
            >
              {label}
            </span>
            <span
              className={`h-0.5 rounded-full transition-colors ${
                i <= railStep ? "bg-foreground/70" : "bg-border"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
