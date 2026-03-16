import { Route } from '@angular/router';

export const AGENCIES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./agency-list.component').then(m => m.AgencyListComponent) },
  { path: 'new', loadComponent: () => import('./agency-form.component').then(m => m.AgencyFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./agency-form.component').then(m => m.AgencyFormComponent) },
];
