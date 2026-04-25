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

interface Document {
  id: number;
  type: string;
  pilgrimId?: number;
  status: string;
  createdAt?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-document-list',
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
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit {
  dataSource: Document[] = [];
  displayedColumns = ['type', 'pilgrimId', 'status', 'createdAt', 'actions'];
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
    this.http.get<PageResponse<Document>>(this.api.documents.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => { this.dataSource = res.content; this.totalElements = res.totalElements; this.loading = false; },
      error: () => { this.notif.error('Erreur chargement documents'); this.loading = false; },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      PASSPORT: 'Passeport',
      VISA: 'Visa',
      FLIGHT_TICKET: 'Billet avion',
      CONTRACT: 'Contrat',
      PROGRAM: 'Programme',
    };
    return labels[type] ?? type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      UPLOADED: 'Uploadé',
      VERIFIED: 'Vérifié',
      REJECTED: 'Refusé',
    };
    return labels[status] ?? status;
  }

  deleteRow(row: Document): void {
    if (!row?.id) return;
    const ok = confirm(`Supprimer ce document (${this.getTypeLabel(row.type)}) ?`);
    if (!ok) return;
    this.http.delete(this.api.documents.delete(row.id)).subscribe({
      next: () => {
        this.notif.success('Document supprimé');
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || 'Suppression impossible'),
    });
  }
}
