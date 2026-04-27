import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { TransportOffer } from './models/transport.models';

@Component({
  selector: 'app-transport-offers',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './transport-offers.component.html',
  styleUrl: '../hotel-operator/hotel-offers.component.scss',
})
export class TransportOffersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  dataSource: TransportOffer[] = [];
  displayedColumns = ['title', 'vehicle', 'status', 'pricing', 'validity', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<TransportOffer[]>(this.api.transportOperator.offersList(null)).subscribe({
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

  pricingLabel(o: TransportOffer): string {
    const key = `transport.pricing.${o.pricingUnit}`;
    return this.i18n.instant(key);
  }

  isActive(o: TransportOffer): boolean {
    return o.status === 'ACTIVE';
  }

  toggleActive(row: TransportOffer, active: boolean): void {
    const prev = row.status;
    row.status = active ? 'ACTIVE' : 'DISABLED';
    this.http.post<TransportOffer>(this.api.transportOperator.setOfferStatus(row.id, active), null).subscribe({
      next: (updated) => {
        row.status = updated?.status ?? row.status;
        this.notif.success(this.i18n.instant('common.saved'));
      },
      error: (err) => {
        row.status = prev;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  deleteRow(row: TransportOffer): void {
    if (!confirm(this.i18n.instant('shop.deleteProductConfirm'))) return;
    this.http.delete(this.api.transportOperator.offerById(row.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.deleteSuccess'));
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('marketplace.deleteError')),
    });
  }
}
