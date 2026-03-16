import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface AgencyRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  status: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-agency-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    PageHeaderComponent,
  ],
  templateUrl: './agency-list.component.html',
  styleUrl: './agency-list.component.scss',
})
export class AgencyListComponent implements OnInit {
  dataSource = new MatTableDataSource<AgencyRow>([]);
  displayedColumns = ['name', 'email', 'city', 'status', 'actions'];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http
      .get<PageResponse<AgencyRow>>(this.api.agencies.list, {
        params: { page: String(this.page - 1), size: String(this.size) },
      })
      .subscribe({
        next: (res) => {
          this.dataSource.data = res.content;
          this.totalElements = res.totalElements;
          this.loading = false;
        },
        error: () => {
          this.notif.error('Erreur chargement des agences');
          this.loading = false;
        },
      });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      SUSPENDED: 'Suspendu',
      EXPIRED: 'Expiré',
    };
    return labels[status] ?? status;
  }
}
