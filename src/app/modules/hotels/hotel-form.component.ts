import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';

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
    FormInitialLoadComponent,
  ],
  templateUrl: './hotel-form.component.html',
  styleUrl: './hotel-form.component.scss',
})
export class HotelFormComponent implements OnInit {
  /** Chargement de l’hôtel en édition uniquement. */
  initialLoading = false;
  saving = false;
  form: FormGroup;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute
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

  ngOnInit(): void {
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!idRaw) return;
    const id = Number(idRaw);
    if (isNaN(id)) return;
    this.editingId = id;
    this.initialLoading = true;
    this.http.get<any>(this.api.hotels.byId(id)).subscribe({
      next: (h) => {
        this.form.patchValue({
          name: h?.name ?? '',
          city: h?.city ?? '',
          address: h?.address ?? '',
          country: h?.country ?? '',
          stars: h?.stars ?? null,
          contactImportant: h?.contactImportant ?? '',
          contactPhone: h?.contactPhone ?? '',
          receptionPhone: h?.receptionPhone ?? '',
          email: h?.email ?? '',
          latitude: h?.latitude ?? null,
          longitude: h?.longitude ?? null,
        });
        this.initialLoading = false;
      },
      error: () => {
        this.initialLoading = false;
        this.notif.error('Impossible de charger l’hôtel');
      },
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
    if (this.form.invalid || this.initialLoading || this.saving) return;
    this.saving = true;
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
    const req$ = this.editingId
      ? this.http.put(this.api.hotels.byId(this.editingId), body)
      : this.http.post(this.api.hotels.list, body);
    req$.subscribe({
      next: () => {
        this.notif.success(this.editingId ? 'Hôtel modifié' : 'Hôtel créé');
        this.router.navigate(['/hotels']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
