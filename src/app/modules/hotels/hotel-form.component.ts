import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  HotelMapLocation,
  HotelMapPickerComponent,
} from '../../shared/components/hotel-map-picker/hotel-map-picker.component';

@Component({
  selector: 'app-hotel-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    TranslatePipe,
    HotelMapPickerComponent,
  ],
  templateUrl: './hotel-form.component.html',
  styleUrl: './hotel-form.component.scss',
})
export class HotelFormComponent {
  loading = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      city: [''],
      address: [''],
      country: [''],
      stars: [null as number | null],
      contactImportant: [''],
      contactPhone: [''],
      receptionPhone: [''],
      email: [''],
      latitude: [null as number | null],
      longitude: [null as number | null],
    });
  }

  onMapLocation(loc: HotelMapLocation): void {
    this.form.patchValue(
      {
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address ?? this.form.get('address')?.value,
        city: loc.city ?? this.form.get('city')?.value,
        country: loc.country ?? this.form.get('country')?.value,
      },
      { emitEvent: false }
    );
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      city: v.city || undefined,
      address: v.address || undefined,
      country: v.country || undefined,
      stars: v.stars != null && v.stars !== '' ? Number(v.stars) : undefined,
      contactImportant: v.contactImportant || undefined,
      contactPhone: v.contactPhone || undefined,
      receptionPhone: v.receptionPhone || undefined,
      email: v.email || undefined,
      latitude: v.latitude != null ? Number(v.latitude) : undefined,
      longitude: v.longitude != null ? Number(v.longitude) : undefined,
    };
    this.http.post(this.api.hotels.list, body).subscribe({
      next: () => {
        this.notif.success('Hôtel créé');
        this.router.navigate(['/hotels']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
