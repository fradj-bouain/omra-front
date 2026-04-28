import { Route } from '@angular/router';

export const PAYMENTS_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./payment-list.component').then(m => m.PaymentListComponent) },
  { path: 'new', loadComponent: () => import('./payment-form.component').then(m => m.PaymentFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./payment-form.component').then(m => m.PaymentFormComponent) },
  { path: ':id', loadComponent: () => import('./payment-detail.component').then(m => m.PaymentDetailComponent) },
];
