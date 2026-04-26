import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { HotelProperty } from './models/hotel.models';

@Component({
  selector: 'app-hotel-property-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './hotel-property-form.component.html',
  styleUrl: './hotel-property-form.component.scss',
})
export class HotelPropertyFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  isNew = false;
  propertyId: number | null = null;
  loading = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    city: [''],
    country: [''],
    address: [''],
    description: [''],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.isNew = this.route.snapshot.url.some((s) => s.path === 'new');
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!this.isNew && idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) {
        this.propertyId = id;
        this.load(id);
      }
    }
  }

  private load(id: number): void {
    this.loading = true;
    this.http.get<HotelProperty[]>(this.api.hotelOperator.properties).subscribe({
      next: (rows) => {
        const p = (rows || []).find((r) => r.id === id);
        this.loading = false;
        if (!p) {
          this.notif.error(this.i18n.instant('common.errorGeneric'));
          void this.router.navigate(['/hotel-operator/properties']);
          return;
        }
        this.form.patchValue({
          name: p.name,
          city: (p.city ?? '') as string,
          country: (p.country ?? '') as string,
          address: (p.address ?? '') as string,
          description: (p.description ?? '') as string,
          imageUrl: (p.imageUrl ?? '') as string,
        });
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
      name: v.name,
      city: v.city || undefined,
      country: v.country || undefined,
      address: v.address || undefined,
      description: v.description || undefined,
      imageUrl: v.imageUrl || undefined,
    };
    const req$ = this.isNew
      ? this.http.post<HotelProperty>(this.api.hotelOperator.properties, body)
      : this.http.put<HotelProperty>(this.api.hotelOperator.propertyById(this.propertyId!), body);
    req$.subscribe({
      next: () => {
        this.notif.success(
          this.isNew
            ? this.i18n.instant('marketplace.form.saveSuccessCreate')
            : this.i18n.instant('marketplace.form.saveSuccessEdit')
        );
        void this.router.navigate(['/hotel-operator/properties']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}
