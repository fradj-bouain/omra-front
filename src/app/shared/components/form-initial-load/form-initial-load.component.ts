import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Spinner + libellé commun pour masquer un formulaire tant que les données initiales
 * (mode édition / détail) ne sont pas chargées.
 */
@Component({
  selector: 'app-form-initial-load',
  standalone: true,
  imports: [MatProgressSpinnerModule, TranslatePipe],
  template: `
    <div class="form-initial-load" role="status" [attr.aria-label]="'common.loading' | translate">
      <mat-progress-spinner mode="indeterminate" diameter="40" />
      <p>{{ 'common.loading' | translate }}</p>
    </div>
  `,
  styles: [
    `
      .form-initial-load {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 14rem;
        gap: 0.75rem;
        color: var(--app-text-soft, #64748b);
      }
      .form-initial-load p {
        margin: 0;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class FormInitialLoadComponent {}
