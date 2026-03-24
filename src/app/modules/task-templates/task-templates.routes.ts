import { Route } from '@angular/router';

export const TASK_TEMPLATES_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./task-template-tree.component').then((m) => m.TaskTemplateTreeComponent),
  },
];
