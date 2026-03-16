import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/services/api.service';
import { NotificationService as SnackbarService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Notification {
  id: number;
  title: string;
  message?: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatListModule, MatIconModule, MatButtonModule, MatPaginatorModule, PageHeaderComponent],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.scss',
})
export class NotificationListComponent implements OnInit {
  dataSource: Notification[] = [];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;

  constructor(private http: HttpClient, private api: ApiService, private notif: SnackbarService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<PageResponse<Notification>>(this.api.notifications.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => { this.dataSource = res.content; this.totalElements = res.totalElements; this.loading = false; },
      error: () => { this.notif.error('Erreur chargement notifications'); this.loading = false; },
    });
  }

  markRead(id: number): void {
    this.http.post(this.api.notifications.markRead(id), {}).subscribe({ next: () => this.load() });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }
}
