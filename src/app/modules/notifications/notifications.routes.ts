import { Route } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./notification-list.component').then(m => m.NotificationListComponent) },
];
