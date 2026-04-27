import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

export type HotelReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface HotelReservationTravelRow {
  id: number;
  offerId: number;
  offerTitle?: string | null;
  propertyName?: string | null;
  hotelAgencyName?: string | null;
  status: HotelReservationStatus;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  units?: number | null;
  desiredFrom?: string | null;
  desiredTo?: string | null;
  note?: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-hotel-reservations-travel',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    DatePipe,
    NgClass,
  ],
  templateUrl: './hotel-reservations-travel.component.html',
  styleUrl: './hotel-reservations-travel.component.scss',
})
export class HotelReservationsTravelComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  rows: HotelReservationTravelRow[] = [];
  displayedColumns: string[] = [
    'offer',
    'hotel',
    'status',
    'period',
    'units',
    'createdAt',
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<HotelReservationTravelRow[]>(this.api.hotelOffers.myReservations).subscribe({
      next: (data) => {
        this.rows = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  statusPillClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') return 'status-pill--ok';
    if (s === 'REJECTED') return 'status-pill--no';
    return 'status-pill--wait';
  }

  statusLabel(status: string): string {
    const s = (status || 'PENDING').toUpperCase() as HotelReservationStatus;
    const key = `hotels.reservation.status.${s}`;
    const t = this.i18n.instant(key);
    return t !== key ? t : status;
  }
}
