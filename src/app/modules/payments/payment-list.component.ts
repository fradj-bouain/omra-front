import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface Payment {
  id: number;
  pilgrimId?: number;
  pilgrimName?: string | null;
  groupId?: number;
  groupName?: string | null;
  amount: number;
  currency: string;
  paymentMethod?: string;
  status: string;
  paymentDate?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTooltipModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss',
})
export class PaymentListComponent implements OnInit {
  dataSource: Payment[] = [];
  displayedColumns = ['pilgrimName', 'groupName', 'amount', 'paymentMethod', 'status', 'paymentDate', 'actions'];
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
    this.http.get<PageResponse<Payment>>(this.api.payments.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => { this.dataSource = res.content; this.totalElements = res.totalElements; this.loading = false; },
      error: () => { this.notif.error('Erreur chargement paiements'); this.loading = false; },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  getMethodLabel(method: string | undefined): string {
    const labels: Record<string, string> = {
      CASH: 'Espèces',
      BANK_TRANSFER: 'Virement',
      CARD: 'Carte',
    };
    return method ? (labels[method] ?? method) : '—';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      PAID: 'Payé',
      PARTIAL: 'Partiel',
      REFUNDED: 'Remboursé',
    };
    return labels[status] ?? status;
  }

  isComplete(status: string): boolean {
    return status === 'PAID';
  }
}
