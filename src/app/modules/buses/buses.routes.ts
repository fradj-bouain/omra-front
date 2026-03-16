import { Route } from '@angular/router';

export const BUSES_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./bus-list.component').then(m => m.BusListComponent) },
  { path: 'new', loadComponent: () => import('./bus-form.component').then(m => m.BusFormComponent) },
];
