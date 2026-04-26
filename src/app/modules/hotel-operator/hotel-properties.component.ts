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
import { HotelProperty } from './models/hotel.models';

@Component({
  selector: 'app-hotel-properties',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, PageHeaderComponent, TranslatePipe],
  templateUrl: './hotel-properties.component.html',
  styleUrl: './hotel-properties.component.scss',
})
export class HotelPropertiesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  loading = false;
  dataSource: HotelProperty[] = [];
  displayedColumns = ['name', 'city', 'country', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<HotelProperty[]>(this.api.hotelOperator.properties).subscribe({
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

  deleteRow(row: HotelProperty): void {
    if (!confirm(this.i18n.instant('shop.deleteProductConfirm'))) return;
    this.http.delete(this.api.hotelOperator.propertyById(row.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.deleteSuccess'));
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('marketplace.deleteError')),
    });
  }
}
