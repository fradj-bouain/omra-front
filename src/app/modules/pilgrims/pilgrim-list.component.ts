import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Pilgrim {
  id: number;
  firstName: string;
  lastName: string;
  passportNumber?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  visaStatus?: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Component({
  selector: 'app-pilgrim-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    PageHeaderComponent,
  ],
  templateUrl: './pilgrim-list.component.html',
  styleUrl: './pilgrim-list.component.scss',
})
export class PilgrimListComponent implements OnInit {
  dataSource = new MatTableDataSource<Pilgrim>([]);
  displayedColumns = ['name', 'passportNumber', 'nationality', 'phone', 'visaStatus', 'actions'];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;
  search = '';

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
    this.http.get<PageResponse<Pilgrim>>(this.api.pilgrims.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: () => {
        this.notif.error('Erreur chargement pèlerins');
        this.loading = false;
      },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  getVisaLabel(status: string | undefined): string {
    if (!status) return '—';
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Refusé',
    };
    return labels[status] || status;
  }

  delete(id: number): void {
    if (!confirm('Supprimer ce pèlerin ?')) return;
    this.http.delete(this.api.pilgrims.byId(id)).subscribe({
      next: () => {
        this.notif.success('Pèlerin supprimé');
        this.load();
      },
      error: () => this.notif.error('Erreur suppression'),
    });
  }
}
