import type { PersonNode, FamilyTreeData, Spouse } from "./types/tree";

export function findNode(
  node: PersonNode,
  nodeId: string
): PersonNode | null {
  if (node.id === nodeId) return node;
  for (const child of node.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

/** Migrate old single-spouse to spouses array */
export function migrateTree(tree: FamilyTreeData): FamilyTreeData {
  const copy = structuredClone(tree);
  migrateNode(copy.root);
  return copy;
}

function migrateNode(node: PersonNode) {
  if (!node.spouses) node.spouses = [];
  // Migrate old spouse field
  if (node.spouse && node.spouses.length === 0) {
    node.spouses.push({
      id: crypto.randomUUID(),
      name: node.spouse.name,
      birthYear: node.spouse.birthYear,
      deathYear: node.spouse.deathYear,
      gender: node.spouse.gender,
    });
    delete node.spouse;
  }
  for (const child of node.children) {
    migrateNode(child);
  }
}

export function addChild(
  tree: FamilyTreeData,
  parentId: string,
  child: PersonNode
): FamilyTreeData {
  const copy = structuredClone(tree);
  const parent = findNode(copy.root, parentId);
  if (parent) {
    parent.children.push(child);
  }
  return copy;
}

export function removeNode(
  tree: FamilyTreeData,
  nodeId: string
): FamilyTreeData {
  if (tree.root.id === nodeId) return tree;
  const copy = structuredClone(tree);
  removeFromParent(copy.root, nodeId);
  return copy;
}

function removeFromParent(node: PersonNode, nodeId: string): boolean {
  const idx = node.children.findIndex((c) => c.id === nodeId);
  if (idx !== -1) {
    node.children.splice(idx, 1);
    return true;
  }
  for (const child of node.children) {
    if (removeFromParent(child, nodeId)) return true;
  }
  return false;
}

export function updateNode(
  tree: FamilyTreeData,
  nodeId: string,
  updates: Partial<Pick<PersonNode, "name" | "birthYear" | "deathYear" | "gender" | "birthplace" | "notes">>
): FamilyTreeData {
  const copy = structuredClone(tree);
  const node = findNode(copy.root, nodeId);
  if (node) {
    Object.assign(node, updates);
  }
  return copy;
}

export function addSpouse(
  tree: FamilyTreeData,
  nodeId: string,
  spouse: Spouse
): FamilyTreeData {
  const copy = structuredClone(tree);
  const node = findNode(copy.root, nodeId);
  if (node) {
    node.spouses.push(spouse);
  }
  return copy;
}

export function updateSpouse(
  tree: FamilyTreeData,
  nodeId: string,
  spouseId: string,
  updates: Partial<Omit<Spouse, "id">>
): FamilyTreeData {
  const copy = structuredClone(tree);
  const node = findNode(copy.root, nodeId);
  if (node) {
    const spouse = node.spouses.find((s) => s.id === spouseId);
    if (spouse) Object.assign(spouse, updates);
  }
  return copy;
}

export function removeSpouse(
  tree: FamilyTreeData,
  nodeId: string,
  spouseId: string
): FamilyTreeData {
  const copy = structuredClone(tree);
  const node = findNode(copy.root, nodeId);
  if (node) {
    node.spouses = node.spouses.filter((s) => s.id !== spouseId);
  }
  return copy;
}

export function toggleCollapse(
  tree: FamilyTreeData,
  nodeId: string
): FamilyTreeData {
  const copy = structuredClone(tree);
  const node = findNode(copy.root, nodeId);
  if (node) {
    node.collapsed = !node.collapsed;
  }
  return copy;
}

export function createPerson(name: string): PersonNode {
  return {
    id: crypto.randomUUID(),
    name,
    spouses: [],
    children: [],
  };
}

/** Count descendants (for delete confirmation) */
export function countDescendants(node: PersonNode): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + countDescendants(child);
  }
  return count;
}

export type SearchResult = {
  nodeId: string;
  label: string;
  sublabel?: string;
};

/** Search tree for matching names (persons + spouses) */
export function searchTree(
  node: PersonNode,
  query: string
): SearchResult[] {
  return searchTreeInner(node, query.toLowerCase());
}

function searchTreeInner(node: PersonNode, q: string): SearchResult[] {
  const results: SearchResult[] = [];

  if (node.name.toLowerCase().includes(q)) {
    results.push({ nodeId: node.id, label: node.name });
  }
  for (const spouse of node.spouses) {
    if (spouse.name.toLowerCase().includes(q)) {
      results.push({
        nodeId: node.id,
        label: spouse.name,
        sublabel: `spouse of ${node.name}`,
      });
    }
  }
  for (const child of node.children) {
    results.push(...searchTreeInner(child, q));
  }
  return results;
}
