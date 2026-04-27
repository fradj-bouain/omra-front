import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { resolveMediaUrl } from '../../shared/utils/media-url';
import { HotelOfferReserveDialogComponent } from './hotel-offer-reserve-dialog.component';

export interface HotelOfferRow {
  id: number;
  title: string;
  description?: string | null;
  pricingUnit: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo: string;
  imageUrl?: string | null;
  propertyImageUrl?: string | null;
  hotelAgencyName?: string | null;
  propertyName?: string | null;
  propertyCity?: string | null;
  propertyCountry?: string | null;
  propertyAddress?: string | null;
  /** Min / max personnes, chambres ou groupes selon pricingUnit (API). */
  minUnits?: number | null;
  maxUnits?: number | null;
}

@Component({
  selector: 'app-hotel-offers-browse',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './hotel-offers-browse.component.html',
  styleUrl: './hotel-offers-browse.component.scss',
})
export class HotelOffersBrowseComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

  loading = false;
  rows: HotelOfferRow[] = [];

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

  coverImage(row: HotelOfferRow): string | null {
    const raw = row.imageUrl || row.propertyImageUrl;
    if (raw == null || String(raw).trim() === '') return null;
    const u = resolveMediaUrl(raw);
    return u || null;
  }

  locationLine(row: HotelOfferRow): string {
    const city = row.propertyCity?.trim();
    const country = row.propertyCountry?.trim();
    if (city && country) return `${city} · ${country}`;
    if (city) return city;
    if (country) return country;
    return '—';
  }

  pricingLabel(row: HotelOfferRow): string {
    const u = (row.pricingUnit || '').toString();
    if (!u) return '';
    const key = `hotels.pricingUnit.${u}`;
    const t = this.i18n.instant(key);
    if (t !== key) return t;
    return u;
  }

  showPriceUnitSubline(row: HotelOfferRow): boolean {
    return (row.pricingUnit || '') !== 'PER_GROUP';
  }

  unitsLineIcon(row: HotelOfferRow): string {
    const u = (row.pricingUnit || 'PER_PERSON').toString();
    if (u === 'PER_ROOM') return 'meeting_room';
    return 'person';
  }

  /**
   * Capacité : personnes, chambres, ou (tarif par groupe) effectif en personnes.
   * En PER_GROUP, min/max = personnes par groupe (texte : « De n à m personnes », pas « n groupes »).
   */
  unitsLine(row: HotelOfferRow): string | null {
    const min = row.minUnits;
    const max = row.maxUnits;
    if (min == null && max == null) return null;
    const pu = (row.pricingUnit || 'PER_PERSON').toString();
    if (pu === 'PER_GROUP') {
      if (min != null && max != null) {
        if (min === max) {
          return this.groupPersonsLabel(min);
        }
        return this.i18n.instant('hotels.offers.groupSizeRange', { min, max });
      }
      if (min != null) {
        return min === 1
          ? this.i18n.instant('hotels.offers.groupSizeFromOne')
          : this.i18n.instant('hotels.offers.groupSizeFromN', { n: min });
      }
      const m = max as number;
      return m === 1
        ? this.i18n.instant('hotels.offers.groupSizeToOne')
        : this.i18n.instant('hotels.offers.groupSizeToN', { n: m });
    }
    const unitKey = `hotels.offers.capacityNoun.${pu}`;
    let unit = this.i18n.instant(unitKey);
    if (unit === unitKey) {
      unit = this.i18n.instant('hotels.offers.capacityNoun._default');
    }
    if (min != null && max != null) {
      if (min === max) {
        return this.i18n.instant('hotels.offers.unitsExact', { n: min, unit });
      }
      return this.i18n.instant('hotels.offers.unitsRange', { min, max, unit });
    }
    if (min != null) {
      return this.i18n.instant('hotels.offers.unitsFrom', { n: min, unit });
    }
    return this.i18n.instant('hotels.offers.unitsTo', { n: max as number, unit });
  }

  private groupPersonsLabel(n: number): string {
    if (n === 1) return this.i18n.instant('hotels.offers.groupSizeOne');
    return this.i18n.instant('hotels.offers.groupSizeN', { n });
  }

  reserve(row: HotelOfferRow): void {
    this.dialog.open(HotelOfferReserveDialogComponent, {
      width: '640px',
      data: { offer: row },
    });
  }
}
