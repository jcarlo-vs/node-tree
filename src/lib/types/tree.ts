export type PersonBase = {
  name: string;
  birthYear?: number;
  deathYear?: number;
  gender?: "male" | "female" | "other";
  birthplace?: string;
  notes?: string;
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
