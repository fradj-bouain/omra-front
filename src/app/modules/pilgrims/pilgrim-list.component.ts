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
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import {
  PilgrimDocumentsDialogComponent,
  PilgrimDocumentsDialogData,
} from '../../shared/components/pilgrim-documents-dialog/pilgrim-documents-dialog.component';

interface Pilgrim {
  id: number;
  firstName: string;
  lastName: string;
  passportNumber?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  visaStatus?: string;
  referralPoints?: number;
  travelerType?: string;
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
    TranslatePipe,
  ],
  templateUrl: './pilgrim-list.component.html',
  styleUrl: './pilgrim-list.component.scss',
})
export class PilgrimListComponent implements OnInit {
  dataSource = new MatTableDataSource<Pilgrim>([]);
  displayedColumns = [
    'documents',
    'name',
    'travelerType',
    'referralPoints',
    'passportNumber',
    'nationality',
    'phone',
    'visaStatus',
    'actions',
  ];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;
  search = '';

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private i18n: I18nService,
    private dialog: MatDialog
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
        this.notif.error(this.i18n.instant('err.pilgrimsLoad'));
        this.loading = false;
      },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  getVisaKey(status: string | undefined): string {
    if (!status) return 'visa.unknown';
    return `visa.${status.toLowerCase()}`;
  }

  openDocumentsDialog(row: Pilgrim, ev: Event): void {
    ev.stopPropagation();
    const data: PilgrimDocumentsDialogData = {
      pilgrimId: row.id,
      pilgrimLabel: `${row.firstName} ${row.lastName}`.trim(),
    };
    this.dialog.open(PilgrimDocumentsDialogComponent, {
      data,
      width: 'min(96vw, 600px)',
      maxHeight: '90vh',
      autoFocus: 'first-tabbable',
      panelClass: 'pilgrim-documents-dialog',
    });
  }

  delete(id: number): void {
    if (!confirm(this.i18n.instant('pilgrims.deleteConfirm'))) return;
    this.http.delete(this.api.pilgrims.byId(id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('pilgrims.deleted'));
        this.load();
      },
      error: () => this.notif.error(this.i18n.instant('err.delete')),
    });
  }
}
