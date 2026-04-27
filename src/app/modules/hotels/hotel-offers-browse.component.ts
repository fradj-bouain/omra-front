import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { HotelOfferReserveDialogComponent } from './hotel-offer-reserve-dialog.component';

interface HotelOfferRow {
  id: number;
  title: string;
  description?: string | null;
  pricingUnit: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo: string;
  hotelAgencyName?: string | null;
  propertyName?: string | null;
  propertyCity?: string | null;
  propertyCountry?: string | null;
  propertyAddress?: string | null;
}

@Component({
  selector: 'app-hotel-offers-browse',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <mat-card class="list-card">
      <div class="list-toolbar">
        <div class="list-title">
          <div class="title">{{ 'hotels.offers.title' | translate }}</div>
          <div class="subtitle">{{ 'hotels.offers.subtitle' | translate }}</div>
        </div>
        <span class="list-count">{{ rows.length }} {{ 'hotels.offers.count' | translate }}</span>
      </div>

      <div class="table-wrap">
        <table mat-table [dataSource]="rows" class="hotel-table full-width">
          <ng-container matColumnDef="offer">
            <th mat-header-cell *matHeaderCellDef>{{ 'hotels.offers.colOffer' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <div class="cell-main">
                <div class="cell-title">{{ row.title }}</div>
                <div class="cell-sub">
                  {{ row.hotelAgencyName || '—' }} · {{ row.propertyName || '—' }}
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef>{{ 'hotels.offers.colLocation' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              {{ row.propertyCity || '—' }} ({{ row.propertyCountry || '—' }})
            </td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>{{ 'hotels.offers.colPrice' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.price }} {{ row.currency }}</td>
          </ng-container>

          <ng-container matColumnDef="validity">
            <th mat-header-cell *matHeaderCellDef>{{ 'hotels.offers.colValidity' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.validFrom }} → {{ row.validTo }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row" class="cell-actions">
              <button mat-flat-button color="primary" type="button" (click)="reserve(row)">
                {{ 'hotels.offers.reserve' | translate }}
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row no-data-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="displayedColumns.length">
              @if (loading) {
                <p class="muted">{{ 'common.loading' | translate }}</p>
              } @else {
                <p class="muted">{{ 'hotels.offers.empty' | translate }}</p>
              }
            </td>
          </tr>
        </table>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .list-toolbar {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .list-title .title {
        font-weight: 700;
      }
      .list-title .subtitle {
        opacity: 0.75;
        font-size: 12px;
        margin-top: 2px;
      }
      .cell-main {
        display: flex;
        flex-direction: column;
      }
      .cell-title {
        font-weight: 600;
      }
      .cell-sub {
        opacity: 0.75;
        font-size: 12px;
        margin-top: 2px;
      }
      .cell-actions {
        display: flex;
        justify-content: flex-end;
      }
      .muted {
        opacity: 0.7;
        margin: 8px 0;
      }
    `,
  ],
})
export class HotelOffersBrowseComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

  loading = false;
  rows: HotelOfferRow[] = [];
  displayedColumns = ['offer', 'location', 'price', 'validity', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<HotelOfferRow[]>(this.api.hotelOffers.listActive).subscribe({
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

  reserve(row: HotelOfferRow): void {
    this.dialog.open(HotelOfferReserveDialogComponent, {
      width: '640px',
      data: { offer: row },
    });
  }
}

