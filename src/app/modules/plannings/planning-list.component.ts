import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
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
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    RouterLink,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './planning-list.component.html',
  styleUrl: './planning-list.component.scss',
})
export class PlanningListComponent implements OnInit {
  dataSource: Planning[] = [];
  loading = false;
  private expanded = new Set<number>();

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

  isExpanded(id: number): boolean {
    return this.expanded.has(id);
  }

  toggleExpanded(id: number): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
  }

  itemsPreview(p: Planning): string {
    if (!p.items?.length) return 'Aucune tâche';
    return p.items.map((i) => i.taskTemplateName).join(' → ');
  }

  itemsForDisplay(p: Planning): PlanningItemDto[] {
    const items = (p.items || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return items;
  }

  previewItems(p: Planning, max = 6): PlanningItemDto[] {
    return this.itemsForDisplay(p).slice(0, max);
  }

  remainingCount(p: Planning, max = 6): number {
    const n = this.itemsForDisplay(p).length;
    return n > max ? n - max : 0;
  }

  totalDurationMinutes(p: Planning): number {
    return this.itemsForDisplay(p).reduce((sum, it) => sum + (it.durationMinutes ?? 0), 0);
  }
}
