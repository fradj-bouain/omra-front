import { Route } from '@angular/router';

export const GROUPS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./group-list.component').then(m => m.GroupListComponent) },
  { path: 'new', loadComponent: () => import('./group-form.component').then(m => m.GroupFormComponent) },
  { path: ':id', loadComponent: () => import('./group-detail.component').then(m => m.GroupDetailComponent) },
];
