import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

interface ReservationRow {
  id: number;
  offerId: number;
  travelAgencyId: number;
  status: ReservationStatus;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  units?: number | null;
  desiredFrom?: string | null;
  desiredTo?: string | null;
  note?: string | null;
  createdAt?: string;
}

@Component({
  selector: 'app-hotel-reservations',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, PageHeaderComponent, TranslatePipe],
  template: `
    <app-page-header
      [title]="'hotel.reservationsTitle' | translate"
      [subtitle]="'hotel.reservationsSubtitle' | translate"
    ></app-page-header>

    <section class="hotel-page">
      <mat-card class="list-card">
        <div class="table-wrap">
          <table mat-table [dataSource]="rows" class="hotel-table full-width">
            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>{{ 'hotel.res.colContact' | translate }}</th>
              <td mat-cell *matCellDef="let row">
                <div class="cell-main">
                  <div class="cell-title">{{ row.contactName }}</div>
                  <div class="cell-sub">
                    {{ row.contactPhone || '—' }} · {{ row.contactEmail || '—' }}
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>{{ 'hotel.res.colPeriod' | translate }}</th>
              <td mat-cell *matCellDef="let row">
                {{ row.desiredFrom || '—' }} → {{ row.desiredTo || '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="units">
              <th mat-header-cell *matHeaderCellDef>{{ 'hotel.res.colUnits' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.units ?? '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ 'common.status' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ statusLabel(row.status) }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row" class="cell-actions">
                <div class="hotel-res__actions">
                  <button
                    mat-stroked-button
                    color="primary"
                    type="button"
                    [disabled]="savingId === row.id || row.status === 'CONFIRMED'"
                    (click)="setStatus(row, 'CONFIRMED')"
                  >
                    {{ 'hotel.res.confirm' | translate }}
                  </button>
                  <button
                    mat-stroked-button
                    color="warn"
                    type="button"
                    [disabled]="savingId === row.id || row.status === 'REJECTED'"
                    (click)="setStatus(row, 'REJECTED')"
                  >
                    {{ 'hotel.res.reject' | translate }}
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

            <tr class="mat-row no-data-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                @if (loading) {
                  <p class="muted">{{ 'common.loading' | translate }}</p>
                } @else {
                  <p class="muted">{{ 'hotel.res.empty' | translate }}</p>
                }
              </td>
            </tr>
          </table>
        </div>
      </mat-card>
    </section>
  `,
  styleUrl: './hotel-reservations.component.scss',
})
export class HotelReservationsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  rows: ReservationRow[] = [];
  displayedColumns = ['contact', 'period', 'units', 'status', 'actions'];
  savingId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<ReservationRow[]>(this.api.hotelOperator.reservations).subscribe({
      next: (rows) => {
        this.rows = Array.isArray(rows) ? rows : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  statusLabel(s: ReservationStatus): string {
    const m: Record<ReservationStatus, string> = {
      PENDING: this.i18n.instant('hotel.res.pending'),
      CONFIRMED: this.i18n.instant('hotel.res.confirmed'),
      REJECTED: this.i18n.instant('hotel.res.rejected'),
    };
    return m[s] ?? s;
  }

  setStatus(row: ReservationRow, status: ReservationStatus): void {
    this.savingId = row.id;
    this.http.post<ReservationRow>(this.api.hotelOperator.reservationStatus(row.id, status), null).subscribe({
      next: (updated) => {
        row.status = updated?.status ?? status;
        this.savingId = null;
        this.notif.success(this.i18n.instant('common.saved'));
      },
      error: (err) => {
        this.savingId = null;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }
}

