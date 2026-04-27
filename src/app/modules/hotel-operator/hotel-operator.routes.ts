import { Routes } from '@angular/router';

export const HOTEL_OPERATOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'properties' },
  {
    path: 'properties/new',
    loadComponent: () =>
      import('./hotel-property-form.component').then((m) => m.HotelPropertyFormComponent),
  },
  {
    path: 'properties/:id/edit',
    loadComponent: () =>
      import('./hotel-property-form.component').then((m) => m.HotelPropertyFormComponent),
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./hotel-properties.component').then((m) => m.HotelPropertiesComponent),
  },
  {
    path: 'offers/new',
    loadComponent: () => import('./hotel-offer-form.component').then((m) => m.HotelOfferFormComponent),
  },
  {
    path: 'offers/:id/edit',
    loadComponent: () => import('./hotel-offer-form.component').then((m) => m.HotelOfferFormComponent),
  },
  {
    path: 'offers',
    loadComponent: () => import('./hotel-offers.component').then((m) => m.HotelOffersComponent),
  },
  {
    path: 'reservations',
    loadComponent: () =>
      import('./hotel-reservations.component').then((m) => m.HotelReservationsComponent),
  },
];
