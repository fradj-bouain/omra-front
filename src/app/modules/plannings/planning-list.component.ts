import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface PlanningItemDto {
  taskTemplateName: string;
  durationMinutes?: number | null;
  sortOrder: number;
}

interface Planning {
  id: number;
  name: string;
  description?: string | null;
  items?: PlanningItemDto[];
}

@Component({
  selector: 'app-planning-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './planning-list.component.html',
})
export class PlanningListComponent implements OnInit {
  dataSource: Planning[] = [];
  displayedColumns = ['name', 'itemsPreview', 'actions'];
  loading = false;

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<Planning[]>(this.api.plannings.list).subscribe({
      next: (list) => {
        this.dataSource = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  delete(id: number, name: string): void {
    if (!confirm(`Supprimer le planning « ${name} » ?`)) return;
    this.http.delete(this.api.plannings.delete(id)).subscribe({
      next: () => this.load(),
      error: (e) => alert(e.error?.message || 'Erreur'),
    });
  }

  itemsPreview(p: Planning): string {
    if (!p.items?.length) return 'Aucune tâche';
    return p.items.map((i) => i.taskTemplateName).join(' → ');
  }
}
