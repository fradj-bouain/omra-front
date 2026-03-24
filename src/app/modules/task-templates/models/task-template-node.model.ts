/** Aligné sur TaskTemplateDto (arbre) */
export interface TaskTemplateNode {
  id: number;
  agencyId?: number;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  parentId?: number | null;
  createdAt?: string | null;
  children: TaskTemplateNode[];
}

export interface TaskTemplateCreatePayload {
  name: string;
  description?: string;
  durationMinutes?: number | null;
  parentId?: number | null;
}
