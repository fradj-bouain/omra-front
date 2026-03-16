import { Route } from '@angular/router';

export const PLANNINGS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./planning-list.component').then(m => m.PlanningListComponent) },
  { path: 'new', loadComponent: () => import('./planning-form.component').then(m => m.PlanningFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./planning-form.component').then(m => m.PlanningFormComponent) },
];
