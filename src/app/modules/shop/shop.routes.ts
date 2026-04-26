import { Routes } from '@angular/router';

export const SHOP_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'articles' },
  {
    path: 'settings',
    loadComponent: () => import('./shop-settings.component').then((m) => m.ShopSettingsComponent),
  },
  {
    path: 'articles/new',
    loadComponent: () => import('./shop-product-form.component').then((m) => m.ShopProductFormComponent),
  },
  {
    path: 'articles/:id',
    loadComponent: () => import('./shop-product-form.component').then((m) => m.ShopProductFormComponent),
  },
  {
    path: 'articles',
    loadComponent: () => import('./shop-articles.component').then((m) => m.ShopArticlesComponent),
    data: { shopMode: 'articles' },
  },
  {
    path: 'stock',
    loadComponent: () => import('./shop-articles.component').then((m) => m.ShopArticlesComponent),
    data: { shopMode: 'stock' },
  },
  {
    path: 'orders',
    loadComponent: () => import('./shop-orders.component').then((m) => m.ShopOrdersComponent),
  },
];
