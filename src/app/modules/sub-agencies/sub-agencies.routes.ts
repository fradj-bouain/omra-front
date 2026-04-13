import { Route } from '@angular/router';
import { mainAgencyAdminGuard } from '../../core/guards/main-agency-admin.guard';

export const SUB_AGENCIES_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [mainAgencyAdminGuard],
    loadComponent: () => import('./sub-agencies-page.component').then((m) => m.SubAgenciesPageComponent),
  },
];
