import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  dataSource: User[] = [];
  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];
  totalElements = 0;
  page = 1;
  size = 20;
  loading = false;

  constructor(private http: HttpClient, private api: ApiService, private notif: NotificationService) {}

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      AGENCY_ADMIN: 'Admin',
      AGENCY_AGENT: 'Service',
      PILGRIM_COMPANION: 'Accompagnateur voyage',
      PILGRIM: 'Client voyageur',
    };
    return labels[role] ?? role;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      DISABLED: 'Désactivé',
    };
    return labels[status] ?? status;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<PageResponse<User>>(this.api.users.list, { params: { page: String(this.page), size: String(this.size) } }).subscribe({
      next: (res) => { this.dataSource = res.content; this.totalElements = res.totalElements; this.loading = false; },
      error: () => { this.notif.error('Erreur chargement utilisateurs'); this.loading = false; },
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex + 1;
    this.size = e.pageSize;
    this.load();
  }

  deleteRow(row: User): void {
    if (!row?.id) return;
    const ok = confirm(`Supprimer l'utilisateur "${row.name}" ?`);
    if (!ok) return;
    this.http.delete(this.api.users.byId(row.id)).subscribe({
      next: () => {
        this.notif.success('Utilisateur supprimé');
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || 'Suppression impossible'),
    });
  }
}
