import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { HotelOffer } from './models/hotel.models';

@Component({
  selector: 'app-hotel-offers',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './hotel-offers.component.html',
  styleUrl: './hotel-offers.component.scss',
})
export class HotelOffersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  dataSource: HotelOffer[] = [];
  displayedColumns = ['title', 'pricing', 'validity', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<HotelOffer[]>(this.api.hotelOperator.offersList(null)).subscribe({
      next: (rows) => {
        this.dataSource = Array.isArray(rows) ? rows : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  pricingLabel(o: HotelOffer): string {
    const key = `hotel.pricing.${o.pricingUnit}`;
    return this.i18n.instant(key);
  }

  deleteRow(row: HotelOffer): void {
    if (!confirm(this.i18n.instant('shop.deleteProductConfirm'))) return;
    this.http.delete(this.api.hotelOperator.offerById(row.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.deleteSuccess'));
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('marketplace.deleteError')),
    });
  }
}
