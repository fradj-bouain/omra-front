import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface HotelOfferRowLite {
  id: number;
  title: string;
  hotelAgencyName?: string | null;
  propertyName?: string | null;
  validFrom?: string;
  validTo?: string;
  minUnits?: number | null;
  maxUnits?: number | null;
}

interface DialogData {
  offer: HotelOfferRowLite;
}

@Component({
  selector: 'app-hotel-offer-reserve-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslatePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'hotels.offers.reserveTitle' | translate }}</h2>
    <mat-dialog-content class="reserve-content">
      <div class="offer-hint">
        <div class="offer-title">{{ data.offer.title }}</div>
        <div class="offer-sub">
          {{ data.offer.hotelAgencyName || '—' }} · {{ data.offer.propertyName || '—' }}
        </div>
      </div>

      <form [formGroup]="form" class="reserve-form">
        <mat-form-field appearance="outline">
          <mat-label>{{ 'hotels.reserve.contactName' | translate }}</mat-label>
          <input matInput formControlName="contactName" />
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'hotels.reserve.contactPhone' | translate }}</mat-label>
            <input matInput formControlName="contactPhone" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'hotels.reserve.contactEmail' | translate }}</mat-label>
            <input matInput formControlName="contactEmail" />
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'hotels.reserve.desiredFrom' | translate }}</mat-label>
            <input matInput [matDatepicker]="dp1" formControlName="desiredFrom" />
            <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
            <mat-datepicker #dp1></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'hotels.reserve.desiredTo' | translate }}</mat-label>
            <input matInput [matDatepicker]="dp2" formControlName="desiredTo" />
            <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
            <mat-datepicker #dp2></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'hotels.reserve.units' | translate }}</mat-label>
          <input
            matInput
            type="number"
            step="1"
            [attr.min]="unitsInputMinAttr()"
            [attr.max]="unitsInputMaxAttr()"
            formControlName="units"
          />
          @if (unitsHintText(); as uhint) {
            <mat-hint>{{ uhint }}</mat-hint>
          }
          @if (form.get('units')?.invalid && form.get('units')?.touched) {
            <mat-error>{{ unitsErrorMessage() }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'hotels.reserve.note' | translate }}</mat-label>
          <textarea matInput rows="4" formControlName="note"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">{{ 'common.cancel' | translate }}</button>
      <button mat-flat-button color="primary" type="button" [disabled]="form.invalid || saving" (click)="submit()">
        {{ saving ? ('common.loading' | translate) : ('hotels.offers.reserve' | translate) }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .reserve-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 6px;
      }
      .offer-hint {
        background: rgba(0, 0, 0, 0.03);
        border-radius: 12px;
        padding: 10px 12px;
      }
      .offer-title {
        font-weight: 700;
      }
      .offer-sub {
        opacity: 0.75;
        font-size: 12px;
        margin-top: 2px;
      }
      .reserve-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      @media (max-width: 640px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class HotelOfferReserveDialogComponent implements OnInit {
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<HotelOfferReserveDialogComponent, boolean>);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);

  saving = false;

  form = this.fb.group({
    contactName: ['', [Validators.required, Validators.maxLength(140)]],
    contactPhone: [''],
    contactEmail: [''],
    desiredFrom: [null as Date | null],
    desiredTo: [null as Date | null],
    units: [null as number | null],
    note: [''],
  });

  ngOnInit(): void {
    const agency = this.auth.agency();
    const user = this.auth.user();
    const contactName = (agency?.name && agency.name.trim()) || (user?.name && user.name.trim()) || '';
    const contactEmail = (agency?.email && agency.email.trim()) || (user?.email && user.email.trim()) || '';
    const contactPhone = (agency?.phone && String(agency.phone).trim()) || (user?.phone && user.phone.trim()) || '';
    this.applyUnitsBoundsFromOffer();
    this.form.patchValue(
      {
        contactName,
        contactEmail,
        contactPhone,
      },
      { emitEvent: false },
    );
  }

  private applyUnitsBoundsFromOffer(): void {
    const o = this.data.offer;
    const minU = o.minUnits != null && o.minUnits > 0 ? o.minUnits : null;
    const maxU = o.maxUnits != null && o.maxUnits > 0 ? o.maxUnits : null;
    const c = this.form.get('units');
    if (!c) return;
    const validators: ValidatorFn[] = [];
    if (minU != null) validators.push(Validators.min(minU));
    if (maxU != null) validators.push(Validators.max(maxU));
    if (minU == null && maxU != null) validators.push(Validators.min(1));
    if (minU != null || maxU != null) {
      validators.push(Validators.required);
    }
    c.setValidators(validators);
    let def: number | null = null;
    if (minU != null) {
      def = minU;
    } else if (maxU != null) {
      def = 1;
    }
    if (def != null && maxU != null && def > maxU) def = maxU;
    if (def != null && minU != null && def < minU) def = minU;
    c.setValue(def, { emitEvent: false });
    c.updateValueAndValidity({ emitEvent: false });
  }

  unitsInputMinAttr(): string | number | null {
    const o = this.data.offer;
    if (o.minUnits != null && o.minUnits > 0) return o.minUnits;
    if (o.maxUnits != null && o.maxUnits > 0) return 1;
    return null;
  }

  unitsInputMaxAttr(): string | number | null {
    const m = this.data.offer.maxUnits;
    return m != null && m > 0 ? m : null;
  }

  unitsHintText(): string {
    const o = this.data.offer;
    const minU = o.minUnits;
    const maxU = o.maxUnits;
    if (minU != null && minU > 0 && maxU != null && maxU > 0) {
      return this.i18n.instant('hotels.reserve.unitsHintRange', { min: minU, max: maxU });
    }
    if (minU != null && minU > 0) {
      return this.i18n.instant('hotels.reserve.unitsHintMin', { n: minU });
    }
    if (maxU != null && maxU > 0) {
      return this.i18n.instant('hotels.reserve.unitsHintMax', { n: maxU });
    }
    return '';
  }

  unitsErrorMessage(): string {
    const c = this.form.get('units');
    if (!c || !c.errors) return '';
    if (c.hasError('required')) {
      return this.i18n.instant('hotels.reserve.unitsRequired');
    }
    if (c.hasError('min')) {
      return this.i18n.instant('hotels.reserve.unitsMin', { n: c.errors['min'].min });
    }
    if (c.hasError('max')) {
      return this.i18n.instant('hotels.reserve.unitsMax', { n: c.errors['max'].max });
    }
    return '';
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const v = this.form.getRawValue();
    const body = {
      contactName: v.contactName,
      contactPhone: v.contactPhone || null,
      contactEmail: v.contactEmail || null,
      desiredFrom: v.desiredFrom ? v.desiredFrom.toISOString().slice(0, 10) : null,
      desiredTo: v.desiredTo ? v.desiredTo.toISOString().slice(0, 10) : null,
      units: v.units ?? null,
      note: v.note || null,
    };

    this.http.post(`${this.api.hotelOffers.listActive}/${this.data.offer.id}/reservations`, body).subscribe({
      next: () => {
        this.saving = false;
        this.notif.success(this.i18n.instant('hotels.reserve.sent'));
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }
}

