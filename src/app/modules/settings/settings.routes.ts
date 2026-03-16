import { Route } from '@angular/router';

export const SETTINGS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./settings.component').then(m => m.SettingsComponent) },
];
