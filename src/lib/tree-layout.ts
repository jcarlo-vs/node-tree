import type { PersonNode } from "./types/tree";

/**
 * Positions a tree by packing sibling subtrees against each other's contours,
 * so a deep narrow branch can tuck beside a shallow one. Nested flexbox can
 * only compare bounding boxes, which is why the old canvas ran so wide.
 *
 * ponytail: the contour scan is O(nodes x depth). Fine into the thousands;
 * swap in threaded Reingold-Tilford if a tree ever gets big enough to notice.
 */

export const NODE_W = 152;
export const NODE_H = 54;
export const ROOT_W = 190;
export const ROOT_H = 64;
export const GAP_X = 24;
export const GAP_Y = 58;
export const PARTNER_GAP = 30;

export type LaidNode = {
  id: string;
  node: PersonNode;
  depth: number;
  /** centre of the whole group (person + partners) */
  x: number;
  y: number;
  /** width of the whole group */
  w: number;
  h: number;
  /** width of the person's own card */
  personW: number;
  /** id of the depth-1 ancestor, used to colour the branch */
  branch: string;
};

export type LaidEdge = { id: string; from: LaidNode; to: LaidNode };

export type Layout = {
  nodes: LaidNode[];
  byId: Map<string, LaidNode>;
  edges: LaidEdge[];
  width: number;
  height: number;
};

type Opts = {
  showPartners: boolean;
  /** measured from the card's own content, so every card gets even padding */
  heightOf?: (node: PersonNode, depth: number) => number;
};

function sizeOf(node: PersonNode, depth: number, opts: Opts) {
  const root = depth === 0;
  const personW = root ? ROOT_W : NODE_W;
  const h = opts.heightOf?.(node, depth) ?? (root ? ROOT_H : NODE_H);
  const partners = opts.showPartners ? node.spouses.length : 0;
  return { personW, h, w: personW + partners * (NODE_W + PARTNER_GAP) };
}

type Sub = {
  placed: { node: PersonNode; depth: number; x: number }[];
  left: number[];
  right: number[];
};

export function layoutTree(root: PersonNode, opts: Opts): Layout {
  const rows: number[] = [];

  function walk(node: PersonNode, depth: number): Sub {
    const { w, h } = sizeOf(node, depth, opts);
    rows[depth] = Math.max(rows[depth] ?? 0, h);

    const kids = node.collapsed ? [] : node.children;
    if (kids.length === 0) {
      return { placed: [{ node, depth, x: 0 }], left: [-w / 2], right: [w / 2] };
    }

    const subs = kids.map((k) => walk(k, depth + 1));
    const offsets: number[] = [];
    const accL: number[] = [];
    const accR: number[] = [];

    subs.forEach((s, i) => {
      let off = 0;
      if (i > 0) {
        off = -Infinity;
        const shared = Math.min(accR.length, s.left.length);
        for (let d = 0; d < shared; d++) {
          off = Math.max(off, accR[d] + GAP_X - s.left[d]);
        }
        if (off === -Infinity) off = 0;
      }
      offsets.push(off);

      for (let d = 0; d < s.left.length; d++) {
        const l = s.left[d] + off;
        const r = s.right[d] + off;
        if (d < accL.length) {
          accL[d] = Math.min(accL[d], l);
          accR[d] = Math.max(accR[d], r);
        } else {
          accL[d] = l;
          accR[d] = r;
        }
      }
    });

    // centre the parent over its first and last child
    const centre = (offsets[0] + offsets[offsets.length - 1]) / 2;

    const placed: Sub["placed"] = [{ node, depth, x: 0 }];
    subs.forEach((s, i) => {
      for (const p of s.placed) {
        placed.push({ node: p.node, depth: p.depth, x: p.x + offsets[i] - centre });
      }
    });

    const left = [-w / 2];
    const right = [w / 2];
    for (let d = 0; d < accL.length; d++) {
      left[d + 1] = accL[d] - centre;
      right[d + 1] = accR[d] - centre;
    }
    return { placed, left, right };
  }

  const res = walk(root, 0);

  // rows are only known after the walk, so turn depths into y positions now
  const rowY: number[] = [];
  let y = 0;
  for (let d = 0; d < rows.length; d++) {
    rowY[d] = y;
    y += (rows[d] ?? NODE_H) + GAP_Y;
  }

  const branchOf = new Map<string, string>();
  (function tag(n: PersonNode, branch: string) {
    branchOf.set(n.id, branch);
    for (const c of n.children) tag(c, n.id === root.id ? c.id : branch);
  })(root, root.id);

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;

  const nodes: LaidNode[] = res.placed.map((p) => {
    const { w, h, personW } = sizeOf(p.node, p.depth, opts);
    minX = Math.min(minX, p.x - w / 2);
    maxX = Math.max(maxX, p.x + w / 2);
    maxY = Math.max(maxY, rowY[p.depth] + h);
    return {
      id: p.node.id,
      node: p.node,
      depth: p.depth,
      x: p.x,
      y: rowY[p.depth],
      w,
      h,
      personW,
      branch: branchOf.get(p.node.id) ?? root.id,
    };
  });

  // shift into a positive coordinate space so the drawing starts at 0,0
  const pad = 24;
  for (const n of nodes) {
    n.x += -minX + pad;
    n.y += pad;
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: LaidEdge[] = [];
  for (const n of nodes) {
    if (n.node.collapsed) continue;
    for (const c of n.node.children) {
      const to = byId.get(c.id);
      if (to) edges.push({ id: `${n.id}-${c.id}`, from: n, to });
    }
  }

  return {
    nodes,
    byId,
    edges,
    width: maxX - minX + pad * 2,
    height: maxY + pad * 2,
  };
}

/** Rounded orthogonal connector: down, across, down. */
export function connectorPath(from: LaidNode, to: LaidNode): string {
  const ox = from.x;
  const oy = from.y + from.h;
  const ix = to.x;
  const iy = to.y;
  const mid = oy + (iy - oy) / 2;

  if (Math.abs(ix - ox) < 0.75) return `M ${ox} ${oy} L ${ix} ${iy}`;

  const dir = ix > ox ? 1 : -1;
  const r = Math.min(12, Math.abs(ix - ox) / 2, Math.abs(mid - oy), Math.abs(iy - mid));

  return (
    `M ${ox} ${oy} L ${ox} ${mid - r}` +
    ` Q ${ox} ${mid} ${ox + dir * r} ${mid}` +
    ` L ${ix - dir * r} ${mid}` +
    ` Q ${ix} ${mid} ${ix} ${mid + r}` +
    ` L ${ix} ${iy}`
  );
}
