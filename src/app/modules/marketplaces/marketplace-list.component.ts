import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { MarketplaceDto } from './models/marketplace.model';

@Component({
  selector: 'app-marketplace-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './marketplace-list.component.html',
  styleUrl: './marketplace-list.component.scss',
})
export class MarketplaceListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  dataSource: MarketplaceDto[] = [];
  displayedColumns = ['name', 'catalogType', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<MarketplaceDto[]>(this.api.marketplaces.list).subscribe({
      next: (res) => {
        this.dataSource = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.loadError'));
      },
    });
  }

  deleteRow(row: MarketplaceDto): void {
    const ok = confirm(this.i18n.instant('marketplace.deleteConfirm', { name: row.name }));
    if (!ok) return;
    this.http.delete(this.api.marketplaces.byId(row.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.deleteSuccess'));
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('marketplace.deleteError')),
    });
  }
}

