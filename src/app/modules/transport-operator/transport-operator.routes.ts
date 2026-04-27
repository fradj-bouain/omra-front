import { Routes } from '@angular/router';

export const TRANSPORT_OPERATOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vehicles' },
  {
    path: 'vehicles/new',
    loadComponent: () =>
      import('./transport-vehicle-form.component').then((m) => m.TransportVehicleFormComponent),
  },
  {
    path: 'vehicles/:id/edit',
    loadComponent: () =>
      import('./transport-vehicle-form.component').then((m) => m.TransportVehicleFormComponent),
  },
  {
    path: 'vehicles',
    loadComponent: () =>
      import('./transport-vehicles.component').then((m) => m.TransportVehiclesComponent),
  },
  {
    path: 'offers/new',
    loadComponent: () =>
      import('./transport-offer-form.component').then((m) => m.TransportOfferFormComponent),
  },
  {
    path: 'offers/:id/edit',
    loadComponent: () =>
      import('./transport-offer-form.component').then((m) => m.TransportOfferFormComponent),
  },
  {
    path: 'offers',
    loadComponent: () =>
      import('./transport-offers.component').then((m) => m.TransportOffersComponent),
  },
  {
    path: 'reservations',
    loadComponent: () =>
      import('./transport-reservations.component').then((m) => m.TransportReservationsComponent),
  },
];
