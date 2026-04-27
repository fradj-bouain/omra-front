import { Route } from '@angular/router';

export const HOTELS_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./hotels-tabs.component').then(m => m.HotelsTabsComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./hotel-list.component').then(m => m.HotelListComponent), data: { embedded: true } },
      { path: 'offers', loadComponent: () => import('./hotel-offers-browse.component').then(m => m.HotelOffersBrowseComponent) },
    ],
  },
  { path: 'new', loadComponent: () => import('./hotel-form.component').then(m => m.HotelFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./hotel-form.component').then(m => m.HotelFormComponent) },
];
