import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { MarketplaceCatalogType, MarketplaceCreateUpdatePayload, MarketplaceDto } from './models/marketplace.model';

@Component({
  selector: 'app-marketplace-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './marketplace-form.component.html',
  styleUrl: './marketplace-form.component.scss',
})
export class MarketplaceFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  loading = false;
  editingId: number | null = null;

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
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!idRaw) return;
    const id = Number(idRaw);
    if (isNaN(id)) return;
    this.editingId = id;
    this.loading = true;
    this.http.get<MarketplaceDto>(this.api.marketplaces.byId(id)).subscribe({
      next: (m) => {
        this.form.patchValue({
          name: m?.name ?? '',
          description: (m?.description ?? '') as any,
          status: m?.status ?? 'ACTIVE',
          catalogType: m?.catalogType ?? 'MANUAL',
          apiBaseUrl: (m?.apiBaseUrl ?? '') as any,
          apiAuthHeader: (m?.apiAuthHeader ?? 'Authorization') as any,
          apiAuthValue: (m?.apiAuthValue ?? '') as any,
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
    const req$ = this.editingId
      ? this.http.put(this.api.marketplaces.byId(this.editingId), body)
      : this.http.post(this.api.marketplaces.list, body);
    req$.subscribe({
      next: () => {
        this.notif.success(
          this.editingId
            ? this.i18n.instant('marketplace.form.saveSuccessEdit')
            : this.i18n.instant('marketplace.form.saveSuccessCreate')
        );
        this.router.navigate(['/marketplaces']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}

