import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../../core/services/api.service';
import { TaskTemplateNode } from '../../../task-templates/models/task-template-node.model';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.scss',
})
export class TaskDetailsComponent implements OnChanges {
  @Input() task: TaskTemplateNode | null = null;

  totalMinutes: number | null = null;
  loadingTotal = false;

  constructor(
    private http: HttpClient,
    private api: ApiService
  ) {}

  ngOnChanges(ch: SimpleChanges): void {
    if (!ch['task']) return;
    if (!this.task?.id) {
      this.totalMinutes = null;
      return;
    }
    this.loadTotal(this.task.id);
  }

  private loadTotal(id: number): void {
    this.loadingTotal = true;
    this.http
      .get<{ totalDurationMinutes: number }>(this.api.taskTemplates.totalDuration(id))
      .subscribe({
        next: (r) => {
          this.totalMinutes = r.totalDurationMinutes;
          this.loadingTotal = false;
        },
        error: () => {
          this.totalMinutes = null;
          this.loadingTotal = false;
        },
      });
  }

  formatDuration(min: number | null | undefined): string {
    if (min == null || min <= 0) return '—';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  subCount(task: TaskTemplateNode): number {
    return task.children?.length ?? 0;
  }

  subtasksLabel(task: TaskTemplateNode): string {
    const n = this.subCount(task);
    if (n === 0) return 'Aucune sous-tâche';
    return n === 1 ? '1 sous-tâche' : `${n} sous-tâches`;
  }
}
