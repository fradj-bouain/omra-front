import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { PageResponse, ShopOrderSummary } from './models/shop.models';

@Component({
  selector: 'app-shop-orders',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatTableModule, MatPaginatorModule, PageHeaderComponent, TranslatePipe],
  templateUrl: './shop-orders.component.html',
  styles: [
    `
      .shop-orders-page {
        max-width: 1100px;
        margin: 0 auto;
      }
      .list-card {
        border-radius: var(--app-radius-lg) !important;
        box-shadow: var(--app-shadow) !important;
        border: 1px solid var(--app-border);
      }
      .table-wrap {
        overflow-x: auto;
      }
      .shop-table {
        width: 100%;
        min-width: 36rem;
      }
      .full-width {
        width: 100%;
      }
      .no-data-row td {
        padding: 2rem 1rem;
        text-align: center;
      }
      .muted {
        margin: 0;
        color: var(--app-muted);
      }
    `,
  ],
})
export class ShopOrdersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  dataSource: ShopOrderSummary[] = [];
  displayedColumns = ['id', 'pilgrimId', 'status', 'total', 'currency', 'createdAt'];
  page = 0;
  size = 20;
  totalElements = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<PageResponse<ShopOrderSummary>>(this.api.shop.orders(this.page, this.size)).subscribe({
      next: (res) => {
        this.dataSource = res?.content ?? [];
        this.totalElements = res?.totalElements ?? 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
      },
    });
  }

  onPage(ev: PageEvent): void {
    this.page = ev.pageIndex;
    this.size = ev.pageSize;
    this.load();
  }
}
