import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { fileUrlFromUploadResponse } from '../../shared/utils/upload-response';
import { resolveMediaUrl } from '../../shared/utils/media-url';
import { HotelOffer, HotelPricingUnit, HotelProperty } from './models/hotel.models';

@Component({
  selector: 'app-hotel-offer-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    FormInitialLoadComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './hotel-offer-form.component.html',
  styleUrl: './hotel-offer-form.component.scss',
})
export class HotelOfferFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);

  readonly defaultCurrency = computed(() => this.auth.agencyCurrency());

  readonly resolveMediaUrl = resolveMediaUrl;

  isNew = false;
  offerId: number | null = null;
  /** Chargement propriétés + offre (édition) — formulaire masqué jusqu’à la fin. */
  initialLoading = true;
  /** Enregistrement en cours (POST/PUT). */
  saving = false;
  uploadingImage = false;
  properties: HotelProperty[] = [];

  readonly form = this.fb.nonNullable.group({
    propertyId: [null as number | null, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(220)]],
    description: [''],
    imageUrl: [''],
    pricingUnit: this.fb.nonNullable.control<HotelPricingUnit>('PER_PERSON'),
    price: [0 as number, [Validators.required, Validators.min(0)]],
    currency: [''],
    minUnits: this.fb.control<number | null>(null),
    maxUnits: this.fb.control<number | null>(null),
    validFrom: ['', Validators.required],
    validTo: ['', Validators.required],
  });

  ngOnInit(): void {
    this.isNew = this.route.snapshot.url.some((s) => s.path === 'new');
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!this.isNew && idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) this.offerId = id;
    }
    this.loadPropertiesThenMaybeOffer();
  }

  private loadPropertiesThenMaybeOffer(): void {
    this.initialLoading = true;
    this.http.get<HotelProperty[]>(this.api.hotelOperator.properties).subscribe({
      next: (rows) => {
        this.properties = Array.isArray(rows) ? rows : [];
        if (this.isNew) {
          this.form.patchValue({ currency: this.defaultCurrency() });
          this.initialLoading = false;
          return;
        }
        if (this.offerId != null) {
          this.http.get<HotelOffer[]>(this.api.hotelOperator.offersList(null)).subscribe({
            next: (offers) => {
              const o = (offers || []).find((x) => x.id === this.offerId);
              this.initialLoading = false;
              if (!o) {
                this.notif.error(this.i18n.instant('common.errorGeneric'));
                void this.router.navigate(['/hotel-operator/offers']);
                return;
              }
              this.form.patchValue({
                propertyId: o.propertyId,
                title: o.title,
                description: (o.description ?? '') as string,
                imageUrl: (o.imageUrl ?? '') as string,
                pricingUnit: o.pricingUnit,
                price: o.price,
                currency: o.currency || this.defaultCurrency(),
                minUnits: o.minUnits ?? null,
                maxUnits: o.maxUnits ?? null,
                validFrom: this.toDateInputValue(o.validFrom),
                validTo: this.toDateInputValue(o.validTo),
              });
            },
            error: (err) => {
              this.initialLoading = false;
              this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
            },
          });
        } else {
          this.initialLoading = false;
        }
      },
      error: (err) => {
        this.initialLoading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  private toDateInputValue(v: string | null | undefined): string {
    if (v == null || v === '') return '';
    const s = String(v).trim();
    return s.length >= 10 ? s.slice(0, 10) : s;
  }

  /** Ouvre le sélecteur de date natif (clic sur l’icône calendrier dans mat-form-field). */
  openNativeDatePicker(input: HTMLInputElement, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    try {
      if (typeof input.showPicker === 'function') {
        void input.showPicker();
        return;
      }
    } catch {
      /* navigateurs ou contextes où showPicker échoue */
    }
    input.focus();
    input.click();
  }

  onOfferImageSelected(_event: Event, input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadingImage = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'hotel-offer-image');
    this.http.post<unknown>(this.api.files.upload, formData).subscribe({
      next: (res) => {
        this.uploadingImage = false;
        const u = fileUrlFromUploadResponse(res);
        if (u) {
          this.form.patchValue({ imageUrl: u });
          this.notif.success(this.i18n.instant('settings.fileUploaded'));
        } else {
          this.notif.error(this.i18n.instant('settings.fileUploadBadResponse'));
        }
      },
      error: () => {
        this.uploadingImage = false;
        this.notif.error(this.i18n.instant('settings.fileUploadError'));
      },
    });
  }

  clearOfferImage(): void {
    this.form.patchValue({ imageUrl: '' });
  }

  onSubmit(): void {
    if (this.form.invalid || this.initialLoading || this.saving || this.uploadingImage) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const body = {
      propertyId: v.propertyId!,
      title: v.title,
      description: v.description || undefined,
      imageUrl: v.imageUrl || undefined,
      pricingUnit: v.pricingUnit,
      price: v.price,
      currency: v.currency || this.defaultCurrency(),
      minUnits: v.minUnits,
      maxUnits: v.maxUnits,
      validFrom: v.validFrom,
      validTo: v.validTo,
    };
    const req$ = this.isNew
      ? this.http.post<HotelOffer>(this.api.hotelOperator.offersList(null), body)
      : this.http.put<HotelOffer>(this.api.hotelOperator.offerById(this.offerId!), body);
    req$.subscribe({
      next: () => {
        this.notif.success(
          this.isNew
            ? this.i18n.instant('marketplace.form.saveSuccessCreate')
            : this.i18n.instant('marketplace.form.saveSuccessEdit')
        );
        void this.router.navigate(['/hotel-operator/offers']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}