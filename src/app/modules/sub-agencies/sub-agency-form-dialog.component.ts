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
import {
  AGENCY_CURRENCIES,
  type AgencyCurrency,
  agencyCurrencyLabel,
} from '../../shared/data/agency-currencies';
import { THEME_PRESETS, type AgencyTheme } from '../../core/services/theme.service';
import type { AgencySubDto } from './agency-sub.dto';

const PRESET_ORDER = [
  'blueSaas',
  'greenIslamic',
  'purpleModern',
  'redBold',
  'darkPro',
  'orangeFriendly',
] as const;

const PRESET_LABEL_KEYS: Record<(typeof PRESET_ORDER)[number], string> = {
  blueSaas: 'settings.palette.blueSaas',
  greenIslamic: 'settings.palette.greenIslamic',
  purpleModern: 'settings.palette.purpleModern',
  redBold: 'settings.palette.redBold',
  darkPro: 'settings.palette.darkPro',
  orangeFriendly: 'settings.palette.orangeFriendly',
};

function stripFromPreset(p: AgencyTheme | undefined): string[] {
  if (!p) return ['#ccc', '#999', '#eee'];
  const a = p.primaryColor ?? '#888';
  const b = p.sidebarColor ?? p.menuColor ?? '#666';
  const c = p.backgroundColor ?? '#f5f5f5';
  return [a, b, c];
}

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

  /** Saisie + filtre pour la devise ; `form.currency` = code ISO 4217. */
  readonly currencySearch = new FormControl('');
  filteredCurrencies: AgencyCurrency[] = [...AGENCY_CURRENCIES];
  private syncingCurrencyUi = false;

  loading = false;
  saving = false;
  private loaded: AgencySubDto | null = null;

  selectedPreset = 'blueSaas';
  readonly presetCards = PRESET_ORDER.map((id) => ({
    id,
    labelKey: PRESET_LABEL_KEYS[id],
    strip: stripFromPreset(THEME_PRESETS[id]),
  }));

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

    this.currencySearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((raw) => {
      const q = (raw ?? '').trim().toLowerCase();
      this.filteredCurrencies = !q
        ? [...AGENCY_CURRENCIES]
        : AGENCY_CURRENCIES.filter(
            (c) =>
              c.labelFr.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
          );
      if (this.syncingCurrencyUi) {
        return;
      }
      if ((raw ?? '').trim() === '') {
        this.form.patchValue({ currency: '' });
        return;
      }
      const expected = agencyCurrencyLabel(this.form.controls.currency.value);
      if (raw !== expected) {
        this.form.patchValue({ currency: '' });
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
            currency: this.normalizeCurrencyCode(dto.currency),
            city: dto.city ?? '',
            address: dto.address ?? '',
            themeMode: 'LIGHT',
            primaryColor: dto.primaryColor ?? '',
            secondaryColor: dto.secondaryColor ?? '',
            backgroundColor: dto.backgroundColor ?? '',
            textColor: dto.textColor ?? '',
          });
          this.applyCountrySearchDisplay(this.form.controls.country.value);
          this.applyCurrencySearchDisplay(this.form.controls.currency.value);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.notif.error(this.i18n.instant('subAgenciesPage.loadOneError'));
          this.dialogRef.close(false);
        },
      });
    } else {
      // Create: start with a sensible default preset so sub-agency gets a nice theme immediately.
      this.applyPresetId(this.selectedPreset);
    }
  }

  applyPresetId(id: string): void {
    const preset = THEME_PRESETS[id];
    if (!preset) {
      this.selectedPreset = '';
      return;
    }
    this.selectedPreset = id;
    this.form.patchValue({
      themeMode: 'LIGHT',
      primaryColor: preset.primaryColor ?? '',
      secondaryColor: preset.secondaryColor ?? '',
      backgroundColor: preset.backgroundColor ?? '',
      textColor: preset.textColor ?? '',
    });
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

  onCurrencySelected(ev: MatAutocompleteSelectedEvent): void {
    const c = ev.option.value as AgencyCurrency;
    if (!c?.code) {
      return;
    }
    this.syncingCurrencyUi = true;
    this.form.patchValue({ currency: c.code });
    this.currencySearch.setValue(c.labelFr, { emitEvent: false });
    this.syncingCurrencyUi = false;
  }

  private normalizeCurrencyCode(raw: string | null | undefined): string {
    const t = raw?.trim();
    if (!t) {
      return '';
    }
    const upper = t.toUpperCase();
    if (AGENCY_CURRENCIES.some((c) => c.code === upper)) {
      return upper;
    }
    return t;
  }

  private applyCurrencySearchDisplay(isoCode: string): void {
    const code = isoCode?.trim() ?? '';
    this.syncingCurrencyUi = true;
    if (!code) {
      this.currencySearch.setValue('', { emitEvent: false });
      this.syncingCurrencyUi = false;
      return;
    }
    const label = agencyCurrencyLabel(code);
    this.currencySearch.setValue(label, { emitEvent: false });
    this.syncingCurrencyUi = false;
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
