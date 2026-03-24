import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/services/api.service';
import {
  TaskTemplateCreatePayload,
  TaskTemplateNode,
} from './models/task-template-node.model';

export const TASK_TEMPLATE_ROOT_DROP_LIST_ID = 'tt-root-list';

export function taskTemplateChildrenDropListId(id: number): string {
  return `tt-list-${id}`;
}

@Injectable({ providedIn: 'root' })
export class TaskTemplatesUiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  readonly tree = signal<TaskTemplateNode[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly connectedDropListIds = computed(() => {
    const ids = [TASK_TEMPLATE_ROOT_DROP_LIST_ID];
    const walk = (nodes: TaskTemplateNode[]) => {
      for (const n of nodes) {
        ids.push(taskTemplateChildrenDropListId(n.id));
        if (n.children?.length) {
          walk(n.children);
        }
      }
    };
    walk(this.tree());
    return ids;
  });

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<TaskTemplateNode[]>(this.api.taskTemplates.tree).subscribe({
      next: (list) => {
        const roots = Array.isArray(list) ? list : [];
        this.tree.set(roots.map((n) => this.normalizeNode(n)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err.error?.message || 'Impossible de charger les types de tâches',
        );
        this.loading.set(false);
      },
    });
  }

  create(body: TaskTemplateCreatePayload) {
    return this.http.post<TaskTemplateNode>(this.api.taskTemplates.create, body);
  }

  remove(id: number) {
    return this.http.delete<void>(this.api.taskTemplates.delete(id));
  }

  handleDrop(event: CdkDragDrop<TaskTemplateNode[]>): void {
    const prevData = event.previousContainer.data;
    const nextData = event.container.data;
    if (!prevData || !nextData) {
      return;
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(nextData, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        prevData,
        nextData,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.tree.update((roots) => structuredClone(roots));
  }

  subtreeTotalMinutes(node: TaskTemplateNode): number {
    const self = node.durationMinutes ?? 0;
    const sub = (node.children ?? []).reduce(
      (acc, c) => acc + this.subtreeTotalMinutes(c),
      0,
    );
    return self + sub;
  }

  formatDuration(min: number): string {
    if (min <= 0) {
      return '—';
    }
    if (min < 60) {
      return `${min} min`;
    }
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  private normalizeNode(raw: TaskTemplateNode): TaskTemplateNode {
    const children = (raw.children ?? []).map((c) => this.normalizeNode(c));
    return {
      ...raw,
      children,
    };
  }
}
