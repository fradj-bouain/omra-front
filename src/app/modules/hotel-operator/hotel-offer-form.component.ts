import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
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

  isNew = false;
  offerId: number | null = null;
  loading = false;
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
    this.loading = true;
    this.http.get<HotelProperty[]>(this.api.hotelOperator.properties).subscribe({
      next: (rows) => {
        this.properties = Array.isArray(rows) ? rows : [];
        if (this.isNew) {
          this.form.patchValue({ currency: this.defaultCurrency() });
          this.loading = false;
          return;
        }
        if (this.offerId != null) {
          this.http.get<HotelOffer[]>(this.api.hotelOperator.offersList(null)).subscribe({
            next: (offers) => {
              const o = (offers || []).find((x) => x.id === this.offerId);
              this.loading = false;
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
                validFrom: o.validFrom,
                validTo: o.validTo,
              });
            },
            error: (err) => {
              this.loading = false;
              this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
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
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}