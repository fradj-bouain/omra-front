import { Route } from '@angular/router';

export const BUSES_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./buses-tabs.component').then((m) => m.BusesTabsComponent),
    children: [
      { path: '', loadComponent: () => import('./bus-list.component').then((m) => m.BusListComponent) },
      {
        path: 'offers',
        loadComponent: () =>
          import('./transport-offers-browse.component').then((m) => m.TransportOffersBrowseComponent),
      },
      {
        path: 'my-reservations',
        loadComponent: () =>
          import('./transport-reservations-travel.component').then((m) => m.TransportReservationsTravelComponent),
      },
    ],
  },
  { path: 'new', loadComponent: () => import('./bus-form.component').then((m) => m.BusFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./bus-form.component').then((m) => m.BusFormComponent) },
];
