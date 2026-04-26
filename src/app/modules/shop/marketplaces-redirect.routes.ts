import { Routes } from '@angular/router';

/** Ancien chemin /marketplaces → nouvelle boutique /shop/settings */
export const MARKETPLACES_REDIRECT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/shop/settings' },
  { path: '**', redirectTo: '/shop/settings' },
];
