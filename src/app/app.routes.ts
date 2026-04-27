import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { agencyKindGuard } from './core/guards/agency-kind.guard';
import { MARKETPLACES_REDIRECT_ROUTES } from './modules/shop/marketplaces-redirect.routes';
import { SHOP_ROUTES } from './modules/shop/shop.routes';
import { HOTEL_OPERATOR_ROUTES } from './modules/hotel-operator/hotel-operator.routes';
import { TRANSPORT_OPERATOR_ROUTES } from './modules/transport-operator/transport-operator.routes';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: 'register',
    loadComponent: () => import('./auth/register-redirect/register-redirect.component').then(m => m.RegisterRedirectComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
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
      { path: 'referral', loadChildren: () => import('./modules/referral/referral.routes').then(m => m.REFERRAL_ROUTES) },
      {
        path: 'marketplaces',
        children: MARKETPLACES_REDIRECT_ROUTES,
      },
      {
        path: 'shop',
        canActivate: [agencyKindGuard(['MARKETPLACE'])],
        children: SHOP_ROUTES,
      },
      {
        path: 'hotel-operator',
        canActivate: [agencyKindGuard(['HOTEL'])],
        children: HOTEL_OPERATOR_ROUTES,
      },
      {
        path: 'transport-operator',
        canActivate: [agencyKindGuard(['TRANSPORT'])],
        children: TRANSPORT_OPERATOR_ROUTES,
      },
      {
        path: 'agency/subs',
        loadChildren: () => import('./modules/sub-agencies/sub-agencies.routes').then((m) => m.SUB_AGENCIES_ROUTES),
      },
      { path: 'settings', loadChildren: () => import('./modules/settings/settings.routes').then(m => m.SETTINGS_ROUTES) },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
