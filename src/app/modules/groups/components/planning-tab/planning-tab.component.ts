import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TaskTreeComponent } from '../task-tree/task-tree.component';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { TaskTemplateNode } from '../../../task-templates/models/task-template-node.model';
import { PlanningTaskRoot } from '../../models/group-planning.model';

@Component({
  selector: 'app-planning-tab',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatIconModule, TaskTreeComponent, TaskDetailsComponent],
  templateUrl: './planning-tab.component.html',
  styleUrl: './planning-tab.component.scss',
})
export class PlanningTabComponent {
  @Input() planningName: string | null = null;
  @Input() roots: PlanningTaskRoot[] = [];
  @Input() loading = false;
  @Input() selected: TaskTemplateNode | null = null;
  @Output() taskSelect = new EventEmitter<TaskTemplateNode>();

  onPick(t: TaskTemplateNode): void {
    this.taskSelect.emit(t);
  }
}
