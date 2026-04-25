import { Route } from '@angular/router';

export const MARKETPLACES_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./marketplace-list.component').then((m) => m.MarketplaceListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./marketplace-form.component').then((m) => m.MarketplaceFormComponent),
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./marketplace-form.component').then((m) => m.MarketplaceFormComponent),
  },
  {
    path: ':id/products',
    loadComponent: () =>
      import('./marketplace-products.component').then((m) => m.MarketplaceProductsComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./marketplace-orders.component').then((m) => m.MarketplaceOrdersComponent),
  },
];

