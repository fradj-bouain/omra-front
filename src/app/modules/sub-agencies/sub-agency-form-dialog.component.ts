import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AGENCY_COUNTRIES, type AgencyCountry, agencyCountryLabel } from '../../shared/data/agency-countries';
import type { AgencySubDto } from './agency-sub.dto';

export interface SubAgencyFormDialogData {
  mode: 'create' | 'edit';
  /** Agence principale (création). */
  parentId?: number;
  /** Sous-agence à modifier. */
  agencyId?: number;
}

@Component({
  selector: 'app-sub-agency-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonToggleModule,
    TranslatePipe,
  ],
  templateUrl: './sub-agency-form-dialog.component.html',
  styleUrl: './sub-agency-form-dialog.component.scss',
})
export class SubAgencyFormDialogComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogRef = inject(MatDialogRef<SubAgencyFormDialogComponent, boolean>);
  readonly data = inject<SubAgencyFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  /** Saisie + filtre pour le pays (affichage) ; `form.country` = code ISO. */
  readonly countrySearch = new FormControl('');
  filteredCountries: AgencyCountry[] = [...AGENCY_COUNTRIES];
  private syncingCountryUi = false;

  loading = false;
  saving = false;
  private loaded: AgencySubDto | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    country: [''],
    currency: [''],
    city: [''],
    address: [''],
    themeMode: this.fb.nonNullable.control<'LIGHT' | 'DARK'>('LIGHT'),
    primaryColor: [''],
    secondaryColor: [''],
    backgroundColor: [''],
    textColor: [''],
  });

  ngOnInit(): void {
    this.countrySearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((raw) => {
      const q = (raw ?? '').trim().toLowerCase();
      this.filteredCountries = !q
        ? [...AGENCY_COUNTRIES]
        : AGENCY_COUNTRIES.filter(
            (c) => c.nameFr.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
          );
      if (this.syncingCountryUi) {
        return;
      }
      if ((raw ?? '').trim() === '') {
        this.form.patchValue({ country: '' });
        return;
      }
      const expected = agencyCountryLabel(this.form.controls.country.value);
      if (raw !== expected) {
        this.form.patchValue({ country: '' });
      }
    });

    if (this.data.mode === 'edit' && this.data.agencyId != null) {
      this.loading = true;
      this.http.get<AgencySubDto>(this.api.agencies.byId(this.data.agencyId)).subscribe({
        next: (dto) => {
          this.loaded = dto;
          this.form.patchValue({
            name: dto.name ?? '',
            email: dto.email ?? '',
            phone: dto.phone ?? '',
            country: this.normalizeCountryCode(dto.country),
            currency: dto.currency ?? '',
            city: dto.city ?? '',
            address: dto.address ?? '',
            themeMode: dto.themeMode === 'DARK' ? 'DARK' : 'LIGHT',
            primaryColor: dto.primaryColor ?? '',
            secondaryColor: dto.secondaryColor ?? '',
            backgroundColor: dto.backgroundColor ?? '',
            textColor: dto.textColor ?? '',
          });
          this.applyCountrySearchDisplay(this.form.controls.country.value);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.notif.error(this.i18n.instant('subAgenciesPage.loadOneError'));
          this.dialogRef.close(false);
        },
      });
    }
  }

  onCountrySelected(ev: MatAutocompleteSelectedEvent): void {
    const c = ev.option.value as AgencyCountry;
    if (!c?.code) {
      return;
    }
    this.syncingCountryUi = true;
    this.form.patchValue({ country: c.code });
    const label = `${c.nameFr} (${c.code})`;
    this.countrySearch.setValue(label, { emitEvent: false });
    this.syncingCountryUi = false;
  }

  private normalizeCountryCode(raw: string | null | undefined): string {
    const t = raw?.trim();
    if (!t) {
      return '';
    }
    const upper = t.toUpperCase();
    if (AGENCY_COUNTRIES.some((c) => c.code === upper)) {
      return upper;
    }
    return t;
  }

  private applyCountrySearchDisplay(isoCode: string): void {
    const code = isoCode?.trim() ?? '';
    this.syncingCountryUi = true;
    if (!code) {
      this.countrySearch.setValue('', { emitEvent: false });
      this.syncingCountryUi = false;
      return;
    }
    const label = agencyCountryLabel(code);
    this.countrySearch.setValue(label, { emitEvent: false });
    this.syncingCountryUi = false;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notif.error(this.i18n.instant('settings.subAgencies.validation'));
      return;
    }
    const v = this.form.getRawValue();
    const opt = (s: string) => {
      const t = s.trim();
      return t === '' ? null : t;
    };
    const themePatch = (): Partial<AgencySubDto> => ({
      themeMode: v.themeMode,
      primaryColor: opt(v.primaryColor),
      secondaryColor: opt(v.secondaryColor),
      backgroundColor: opt(v.backgroundColor),
      textColor: opt(v.textColor),
    });

    if (this.data.mode === 'create') {
      const parentId = this.data.parentId;
      if (parentId == null) return;
      this.saving = true;
      const body: AgencySubDto = {
        name: v.name.trim(),
        email: v.email.trim(),
        phone: opt(v.phone),
        country: opt(v.country),
        currency: opt(v.currency),
        city: opt(v.city),
        address: opt(v.address),
        status: 'ACTIVE',
        ...themePatch(),
      };
      this.http.post<AgencySubDto>(this.api.agencies.subAgencies(parentId), body).subscribe({
        next: () => {
          this.saving = false;
          this.notif.success(this.i18n.instant('settings.subAgencies.created'));
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving = false;
          this.notif.error(this.i18n.instant('settings.subAgencies.createError'));
        },
      });
      return;
    }

    const id = this.data.agencyId;
    if (id == null || this.loaded == null) return;
    this.saving = true;
    const payload: AgencySubDto = {
      ...this.loaded,
      name: v.name.trim(),
      email: v.email.trim(),
      phone: opt(v.phone),
      country: opt(v.country),
      currency: opt(v.currency),
      city: opt(v.city),
      address: opt(v.address),
      ...themePatch(),
    };
    this.http.put<AgencySubDto>(this.api.agencies.byId(id), payload).subscribe({
      next: () => {
        this.saving = false;
        this.notif.success(this.i18n.instant('subAgenciesPage.saved'));
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving = false;
        this.notif.error(this.i18n.instant('subAgenciesPage.saveError'));
      },
    });
  }
}
