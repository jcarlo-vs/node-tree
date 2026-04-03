export const TREE_TYPES = {
  family: { label: "Family Tree", icon: "👨‍👩‍👧‍👦", description: "Clan lineage with spouses" },
  org: { label: "Org Chart", icon: "🏢", description: "Company or team hierarchy" },
  mindmap: { label: "Mind Map", icon: "🧠", description: "Ideas and brainstorming" },
  skill: { label: "Skill Tree", icon: "⚡", description: "Learning path or progression" },
  decision: { label: "Decision Tree", icon: "🔀", description: "Choices and outcomes" },
} as const;

export type TreeType = keyof typeof TREE_TYPES;

export type PersonBase = {
  name: string;
  // Family tree fields
  birthYear?: number;
  deathYear?: number;
  gender?: "male" | "female" | "other";
  birthplace?: string;
  // Org chart fields
  role?: string;
  department?: string;
  // Skill tree fields
  status?: "planned" | "in-progress" | "completed";
  // General
  notes?: string;
  // Generic value (for decision tree outcomes, mind map details, etc.)
  value?: string;
  // Custom node color (non-family types only)
  color?: string;
};

export type Spouse = PersonBase & {
  id: string;
};

export type PersonNode = PersonBase & {
  id: string;
  /** @deprecated Use spouses[] — kept only for migration of old data */
  spouse?: Omit<Spouse, "id">;
  spouses: Spouse[];
  children: PersonNode[];
  collapsed?: boolean;
};

export type FamilyTreeData = {
  root: PersonNode;
};
