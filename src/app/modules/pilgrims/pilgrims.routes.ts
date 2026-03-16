import { Route } from '@angular/router';

export const PILGRIMS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./pilgrim-list.component').then(m => m.PilgrimListComponent) },
  { path: 'new', loadComponent: () => import('./pilgrim-form.component').then(m => m.PilgrimFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./pilgrim-form.component').then(m => m.PilgrimFormComponent) },
  { path: ':id', loadComponent: () => import('./pilgrim-detail.component').then(m => m.PilgrimDetailComponent) },
];
