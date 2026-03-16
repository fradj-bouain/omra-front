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

interface TaskTemplate {
  id: number;
  name: string;
  durationMinutes?: number | null;
}

@Component({
  selector: 'app-task-template-list',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, PageHeaderComponent],
  templateUrl: './task-template-list.component.html',
})
export class TaskTemplateListComponent implements OnInit {
  dataSource: TaskTemplate[] = [];
  displayedColumns = ['name', 'durationMinutes', 'actions'];
  loading = false;

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<TaskTemplate[]>(this.api.taskTemplates.list).subscribe({
      next: (list) => {
        this.dataSource = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  delete(id: number, name: string): void {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    this.http.delete(this.api.taskTemplates.delete(id)).subscribe({
      next: () => this.load(),
      error: (e) => alert(e.error?.message || 'Erreur'),
    });
  }

  formatDuration(min: number | null | undefined): string {
    if (min == null || min === 0) return '—';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
}
