import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export type AgencyKindUi = 'TRAVEL' | 'MARKETPLACE' | 'HOTEL' | 'TRANSPORT';

export function agencyKindGuard(allowed: AgencyKindUi[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const raw = auth.agency()?.agencyKind;
    const kind: AgencyKindUi =
      raw === 'MARKETPLACE' || raw === 'HOTEL' || raw === 'TRANSPORT' ? raw : 'TRAVEL';
    if (allowed.includes(kind)) {
      return true;
    }
    void router.navigate(['/dashboard']);
    return false;
  };
}
