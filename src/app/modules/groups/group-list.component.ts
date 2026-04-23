import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';

interface Group {
  id: number;
  name: string;
  departureDate?: string;
  returnDate?: string;
  maxCapacity?: number;
  status: string;
  companionIds?: number[];
  /** Noms des accompagnateurs (API), même ordre que companionIds */
  companionNames?: string[];
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent implements OnInit {
  dataSource: Group[] = [];
  displayedColumns = ['name', 'departureDate', 'returnDate', 'maxCapacity', 'companions', 'status', 'actions'];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<PageResponse<Group>>(this.api.groups.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => { this.dataSource = res.content; this.totalElements = res.totalElements; this.loading = false; },
      error: () => {
        this.notif.error(this.i18n.instant('err.groupsLoad'));
        this.loading = false;
      },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  getStatusKey(status: string | undefined): string {
    if (!status) return 'common.emDash';
    return `group.status.${status}`;
  }
}
