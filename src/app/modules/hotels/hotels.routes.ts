import { Route } from '@angular/router';

export const HOTELS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./hotel-list.component').then(m => m.HotelListComponent) },
  { path: 'new', loadComponent: () => import('./hotel-form.component').then(m => m.HotelFormComponent) },
];
