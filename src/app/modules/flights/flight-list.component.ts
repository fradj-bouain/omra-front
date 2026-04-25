import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Flight {
  id: number;
  airline?: string;
  flightNumber?: string;
  departureCity?: string;
  arrivalCity?: string;
  departureTime?: string;
  arrivalTime?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-flight-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTooltipModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './flight-list.component.html',
  styleUrl: './flight-list.component.scss',
})
export class FlightListComponent implements OnInit {
  dataSource: Flight[] = [];
  displayedColumns = [
    'airline',
    'flightNumber',
    'departureCity',
    'arrivalCity',
    'departureTime',
    'arrivalTime',
    'actions',
  ];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;

  constructor(private http: HttpClient, private api: ApiService, private notif: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<PageResponse<Flight>>(this.api.flights.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => { this.dataSource = res.content; this.totalElements = res.totalElements; this.loading = false; },
      error: () => { this.notif.error('Erreur chargement vols'); this.loading = false; },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  deleteRow(row: Flight): void {
    if (!row?.id) return;
    const label = `${row.airline ?? ''} ${row.flightNumber ?? ''}`.trim() || `#${row.id}`;
    const ok = confirm(`Supprimer le vol "${label}" ?`);
    if (!ok) return;
    this.http.delete(this.api.flights.byId(row.id)).subscribe({
      next: () => {
        this.notif.success('Vol supprimé');
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || 'Suppression impossible'),
    });
  }
}
