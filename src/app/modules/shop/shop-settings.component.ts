import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { MarketplaceCatalogType, MarketplaceCreateUpdatePayload, MarketplaceDto } from '../marketplaces/models/marketplace.model';

@Component({
  selector: 'app-shop-settings',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './shop-settings.component.html',
  styleUrl: './shop-settings.component.scss',
})
export class ShopSettingsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);

  loading = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    description: [''],
    status: this.fb.nonNullable.control<'ACTIVE' | 'INACTIVE'>('ACTIVE'),
    catalogType: this.fb.nonNullable.control<MarketplaceCatalogType>('MANUAL'),
    apiBaseUrl: [''],
    apiAuthHeader: ['Authorization'],
    apiAuthValue: [''],
  });

  ngOnInit(): void {
    this.loading = true;
    this.http.get<MarketplaceDto>(this.api.shop.marketplace).subscribe({
      next: (m) => {
        this.form.patchValue({
          name: m?.name ?? '',
          description: (m?.description ?? '') as string,
          status: m?.status ?? 'ACTIVE',
          catalogType: m?.catalogType ?? 'MANUAL',
          apiBaseUrl: (m?.apiBaseUrl ?? '') as string,
          apiAuthHeader: (m?.apiAuthHeader ?? 'Authorization') as string,
          apiAuthValue: (m?.apiAuthValue ?? '') as string,
        });
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.loadOneError'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body: MarketplaceCreateUpdatePayload = {
      name: v.name,
      description: v.description || undefined,
      status: v.status,
      catalogType: v.catalogType,
      apiBaseUrl: v.catalogType === 'EXTERNAL_API' ? (v.apiBaseUrl || undefined) : undefined,
      apiAuthHeader: v.catalogType === 'EXTERNAL_API' ? (v.apiAuthHeader || undefined) : undefined,
      apiAuthValue: v.catalogType === 'EXTERNAL_API' ? (v.apiAuthValue || undefined) : undefined,
    };
    this.http.put<MarketplaceDto>(this.api.shop.marketplace, body).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.form.saveSuccessEdit'));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}
