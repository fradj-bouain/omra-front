import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { ShopProduct, ShopProductWritePayload } from './models/shop.models';
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';

@Component({
  selector: 'app-shop-product-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    PageHeaderComponent,
    TranslatePipe,
    FormInitialLoadComponent,
  ],
  templateUrl: './shop-product-form.component.html',
  styleUrl: './shop-product-form.component.scss',
})
export class ShopProductFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);

  readonly defaultCurrency = computed(() => this.auth.agencyCurrency());

  initialLoading = false;
  saving = false;
  isNew = false;
  productId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    imageUrl: [''],
    price: [0 as number, [Validators.required, Validators.min(0)]],
    currency: [''],
    inStock: this.fb.nonNullable.control(true),
    stockQuantity: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    this.isNew = this.route.snapshot.url.some((s) => s.path === 'new');
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!this.isNew && idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) {
        this.productId = id;
        this.load(id);
      }
    } else {
      this.form.patchValue({ currency: this.defaultCurrency() });
    }
  }

  private load(id: number): void {
    this.initialLoading = true;
    this.http.get<ShopProduct[]>(this.api.shop.products).subscribe({
      next: (rows) => {
        const p = (rows || []).find((r) => r.id === id);
        this.initialLoading = false;
        if (!p) {
          this.notif.error(this.i18n.instant('common.errorGeneric'));
          void this.router.navigate(['/shop/articles']);
          return;
        }
        this.form.patchValue({
          title: p.title,
          description: (p.description ?? '') as string,
          imageUrl: (p.imageUrl ?? '') as string,
          price: p.price,
          currency: p.currency || this.defaultCurrency(),
          inStock: p.inStock,
          stockQuantity: p.stockQuantity ?? null,
        });
      },
      error: (err) => {
        this.initialLoading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.loadError'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.initialLoading || this.saving) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const body: ShopProductWritePayload = {
      title: v.title,
      description: v.description || undefined,
      imageUrl: v.imageUrl || undefined,
      price: v.price,
      currency: v.currency || this.defaultCurrency(),
      inStock: v.inStock,
      stockQuantity: v.stockQuantity,
    };
    const req$ = this.isNew
      ? this.http.post<ShopProduct>(this.api.shop.products, body)
      : this.http.put<ShopProduct>(this.api.shop.productById(this.productId!), body);
    req$.subscribe({
      next: () => {
        this.notif.success(
          this.isNew
            ? this.i18n.instant('marketplace.form.saveSuccessCreate')
            : this.i18n.instant('marketplace.form.saveSuccessEdit')
        );
        void this.router.navigate(['/shop/articles']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}
