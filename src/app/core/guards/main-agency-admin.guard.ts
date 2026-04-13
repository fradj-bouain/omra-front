import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Accès réservé à un administrateur d’agence rattaché à une agence principale (pas une sous-agence). */
export const mainAgencyAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.user();
  const a = auth.agency();
  if (u?.role !== 'AGENCY_ADMIN' || a == null || a.parentAgencyId != null) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
