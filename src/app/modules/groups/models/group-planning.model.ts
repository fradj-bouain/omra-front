import { TaskTemplateNode } from '../../task-templates/models/task-template-node.model';

export interface PlanningTaskRoot {
  sortOrder: number;
  planItemId?: number;
  task: TaskTemplateNode;
}
