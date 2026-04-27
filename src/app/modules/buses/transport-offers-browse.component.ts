import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { resolveMediaUrl } from '../../shared/utils/media-url';
import { TransportOfferReserveDialogComponent } from './transport-offer-reserve-dialog.component';

export interface TransportOfferRow {
  id: number;
  title: string;
  description?: string | null;
  pricingUnit: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo: string;
  imageUrl?: string | null;
  transportAgencyName?: string | null;
  vehiclePlate?: string | null;
  vehicleBrand?: string | null;
  vehicleSeatCount?: number | null;
  minUnits?: number | null;
  maxUnits?: number | null;
}

@Component({
  selector: 'app-transport-offers-browse',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './transport-offers-browse.component.html',
  styleUrl: '../hotels/hotel-offers-browse.component.scss',
})
export class TransportOffersBrowseComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

  loading = false;
  rows: TransportOfferRow[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<TransportOfferRow[]>(this.api.transportOffers.listActive).subscribe({
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

  coverImage(row: TransportOfferRow): string | null {
    const raw = row.imageUrl;
    if (raw == null || String(raw).trim() === '') return null;
    const u = resolveMediaUrl(raw);
    return u || null;
  }

  pricingLabel(row: TransportOfferRow): string {
    const u = (row.pricingUnit || '').toString();
    const key = `transport.pricing.${u}`;
    const t = this.i18n.instant(key);
    if (t !== key) return t;
    return u;
  }

  showPriceUnitSubline(row: TransportOfferRow): boolean {
    return true;
  }

  vehicleLine(row: TransportOfferRow): string {
    const plate = row.vehiclePlate?.trim();
    const brand = row.vehicleBrand?.trim();
    if (plate && brand) return `${plate} · ${brand}`;
    return plate || brand || '—';
  }

  reserve(row: TransportOfferRow): void {
    this.dialog.open(TransportOfferReserveDialogComponent, {
      width: '640px',
      data: { offer: row },
    });
  }
}
