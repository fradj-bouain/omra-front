import { Route } from '@angular/router';

export const REFERRAL_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./referral.component').then(m => m.ReferralComponent) },
];
