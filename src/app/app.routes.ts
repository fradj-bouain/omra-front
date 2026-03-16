import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
      { path: 'agencies', loadChildren: () => import('./modules/agencies/agencies.routes').then(m => m.AGENCIES_ROUTES), canActivate: [adminGuard] },
      { path: 'pilgrims', loadChildren: () => import('./modules/pilgrims/pilgrims.routes').then(m => m.PILGRIMS_ROUTES) },
      { path: 'groups', loadChildren: () => import('./modules/groups/groups.routes').then(m => m.GROUPS_ROUTES) },
      { path: 'flights', loadChildren: () => import('./modules/flights/flights.routes').then(m => m.FLIGHTS_ROUTES) },
      { path: 'hotels', loadChildren: () => import('./modules/hotels/hotels.routes').then(m => m.HOTELS_ROUTES) },
      { path: 'documents', loadChildren: () => import('./modules/documents/documents.routes').then(m => m.DOCUMENTS_ROUTES) },
      { path: 'payments', loadChildren: () => import('./modules/payments/payments.routes').then(m => m.PAYMENTS_ROUTES) },
      { path: 'task-templates', loadChildren: () => import('./modules/task-templates/task-templates.routes').then(m => m.TASK_TEMPLATES_ROUTES) },
      { path: 'plannings', loadChildren: () => import('./modules/plannings/plannings.routes').then(m => m.PLANNINGS_ROUTES) },
      { path: 'buses', loadChildren: () => import('./modules/buses/buses.routes').then(m => m.BUSES_ROUTES) },
      { path: 'notifications', loadChildren: () => import('./modules/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES) },
      { path: 'users', loadChildren: () => import('./modules/users/users.routes').then(m => m.USERS_ROUTES) },
      { path: 'settings', loadChildren: () => import('./modules/settings/settings.routes').then(m => m.SETTINGS_ROUTES) },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
