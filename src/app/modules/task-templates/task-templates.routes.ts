import { Route } from '@angular/router';

export const TASK_TEMPLATES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./task-template-list.component').then(m => m.TaskTemplateListComponent) },
  { path: 'new', loadComponent: () => import('./task-template-form.component').then(m => m.TaskTemplateFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./task-template-form.component').then(m => m.TaskTemplateFormComponent) },
];
