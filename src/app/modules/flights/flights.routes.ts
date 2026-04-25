import { Route } from '@angular/router';

export const FLIGHTS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./flight-list.component').then(m => m.FlightListComponent) },
  { path: 'new', loadComponent: () => import('./flight-form.component').then(m => m.FlightFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./flight-form.component').then(m => m.FlightFormComponent) },
];
