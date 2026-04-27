import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Hotel {
  id: number;
  name: string;
  city?: string;
  address?: string;
  country?: string;
  stars?: number;
  contactImportant?: string;
  contactPhone?: string;
  receptionPhone?: string;
  email?: string;
}

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTooltipModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
  ],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.scss',
})
export class HotelListComponent implements OnInit {
  @Input() embedded = false;
  dataSource: Hotel[] = [];
  displayedColumns = ['name', 'city', 'country', 'stars', 'receptionPhone', 'contactImportant', 'actions'];
  loading = false;

  private readonly route = inject(ActivatedRoute);

  constructor(private http: HttpClient, private api: ApiService, private notif: NotificationService) {}

  ngOnInit(): void {
    const fromRoute = this.route.snapshot.data?.['embedded'];
    if (typeof fromRoute === 'boolean') {
      this.embedded = fromRoute;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<Hotel[]>(this.api.hotels.list).subscribe({
      next: (data) => {
        this.dataSource = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notif.error('Erreur chargement hôtels');
      },
    });
  }

  deleteRow(row: Hotel): void {
    if (!row?.id) return;
    const ok = confirm(`Supprimer l'hôtel "${row.name}" ?`);
    if (!ok) return;
    this.http.delete(this.api.hotels.byId(row.id)).subscribe({
      next: () => {
        this.notif.success('Hôtel supprimé');
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || 'Suppression impossible'),
    });
  }
}
