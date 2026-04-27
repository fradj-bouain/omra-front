import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { TransportVehicle, TransportVehicleType } from './models/transport.models';

@Component({
  selector: 'app-transport-vehicle-form',
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
    FormInitialLoadComponent,
    TranslatePipe,
  ],
  templateUrl: './transport-vehicle-form.component.html',
  styleUrl: './transport-vehicle-form.component.scss',
})
export class TransportVehicleFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly vehicleTypes: TransportVehicleType[] = ['BUS', 'CAR', 'VAN', 'MINIBUS', 'OTHER'];

  isNew = false;
  vehicleId: number | null = null;
  initialLoading = false;
  saving = false;

  readonly form = this.fb.nonNullable.group({
    vehicleType: this.fb.nonNullable.control<TransportVehicleType>('BUS'),
    seatCount: [1 as number, [Validators.required, Validators.min(1)]],
    plate: [''],
    brand: [''],
    driverName: [''],
    driverPhone: [''],
    driverEmail: [''],
    address: [''],
  });

  ngOnInit(): void {
    this.isNew = this.route.snapshot.url.some((s) => s.path === 'new');
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!this.isNew && idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) {
        this.vehicleId = id;
        this.load(id);
      }
    }
  }

  private load(id: number): void {
    this.initialLoading = true;
    this.http.get<TransportVehicle[]>(this.api.transportOperator.vehicles).subscribe({
      next: (rows) => {
        const v = (rows || []).find((r) => r.id === id);
        this.initialLoading = false;
        if (!v) {
          this.notif.error(this.i18n.instant('common.errorGeneric'));
          void this.router.navigate(['/transport-operator/vehicles']);
          return;
        }
        this.form.patchValue({
          vehicleType: v.vehicleType,
          seatCount: v.seatCount,
          plate: (v.plate ?? '') as string,
          brand: (v.brand ?? '') as string,
          driverName: (v.driverName ?? '') as string,
          driverPhone: (v.driverPhone ?? '') as string,
          driverEmail: (v.driverEmail ?? '') as string,
          address: (v.address ?? '') as string,
        });
      },
      error: (err) => {
        this.initialLoading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.initialLoading || this.saving) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const body = {
      vehicleType: v.vehicleType,
      seatCount: v.seatCount,
      plate: v.plate || undefined,
      brand: v.brand || undefined,
      driverName: v.driverName || undefined,
      driverPhone: v.driverPhone || undefined,
      driverEmail: v.driverEmail || undefined,
      address: v.address || undefined,
    };
    const req$ = this.isNew
      ? this.http.post<TransportVehicle>(this.api.transportOperator.vehicles, body)
      : this.http.put<TransportVehicle>(this.api.transportOperator.vehicleById(this.vehicleId!), body);
    req$.subscribe({
      next: () => {
        this.notif.success(
          this.isNew
            ? this.i18n.instant('marketplace.form.saveSuccessCreate')
            : this.i18n.instant('marketplace.form.saveSuccessEdit')
        );
        void this.router.navigate(['/transport-operator/vehicles']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError'));
      },
    });
  }
}
