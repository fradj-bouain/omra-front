import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TaskTemplateNode } from '../../../task-templates/models/task-template-node.model';
import { PlanningTaskRoot } from '../../models/group-planning.model';

@Component({
  selector: 'app-task-tree',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconModule],
  templateUrl: './task-tree.component.html',
  styleUrl: './task-tree.component.scss',
})
export class TaskTreeComponent implements OnChanges {
  @Input() roots: PlanningTaskRoot[] = [];
  @Input() selectedId: number | null = null;
  @Output() taskSelect = new EventEmitter<TaskTemplateNode>();

  /** Expanded node ids */
  readonly expanded = new Set<number>();

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['roots'] && this.roots?.length) {
      this.expanded.clear();
      for (const r of this.roots) {
        this.expandRecursive(r.task);
      }
    }
  }

  private expandRecursive(n: TaskTemplateNode): void {
    if (n.children?.length) {
      this.expanded.add(n.id);
      for (const c of n.children) {
        this.expandRecursive(c);
      }
    }
  }

  toggle(node: TaskTemplateNode, ev: Event): void {
    ev.stopPropagation();
    if (!node.children?.length) return;
    if (this.expanded.has(node.id)) {
      this.expanded.delete(node.id);
    } else {
      this.expanded.add(node.id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expanded.has(id);
  }

  pick(node: TaskTemplateNode): void {
    this.taskSelect.emit(node);
  }

  trackRoot = (_: number, r: PlanningTaskRoot) => r.planItemId ?? r.sortOrder;
  trackNode = (_: number, n: TaskTemplateNode) => n.id;
}
