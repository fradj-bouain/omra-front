import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
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
    MatSelectModule,
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
  readonly dialogRef = inject(MatDialogRef<SubAgencyFormDialogComponent, boolean>);
  readonly data = inject<SubAgencyFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

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
    if (this.data.mode === 'edit' && this.data.agencyId != null) {
      this.loading = true;
      this.http.get<AgencySubDto>(this.api.agencies.byId(this.data.agencyId)).subscribe({
        next: (dto) => {
          this.loaded = dto;
          this.form.patchValue({
            name: dto.name ?? '',
            email: dto.email ?? '',
            phone: dto.phone ?? '',
            country: dto.country ?? '',
            currency: dto.currency ?? '',
            city: dto.city ?? '',
            address: dto.address ?? '',
            themeMode: dto.themeMode === 'DARK' ? 'DARK' : 'LIGHT',
            primaryColor: dto.primaryColor ?? '',
            secondaryColor: dto.secondaryColor ?? '',
            backgroundColor: dto.backgroundColor ?? '',
            textColor: dto.textColor ?? '',
          });
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
