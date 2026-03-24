import { Component, Input, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  TaskTemplatesUiService,
  taskTemplateChildrenDropListId,
} from './task-templates-ui.service';
import { TaskTemplateNode } from './models/task-template-node.model';
import {
  TaskTemplateFormDialogComponent,
  TaskTemplateFormDialogData,
  TaskTemplateFormDialogResult,
} from './task-template-form-dialog.component';

@Component({
  selector: 'app-task-template-item',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    DragDropModule,
    TaskTemplateItemComponent,
  ],
  templateUrl: './task-template-item.component.html',
  styleUrl: './task-template-item.component.scss',
})
export class TaskTemplateItemComponent {
  @Input({ required: true }) task!: TaskTemplateNode;
  @Input() depth = 0;

  readonly ui = inject(TaskTemplatesUiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly expanded = signal(true);

  readonly childrenListId = computed(() =>
    taskTemplateChildrenDropListId(this.task.id),
  );

  readonly totalSubtree = computed(() => this.ui.subtreeTotalMinutes(this.task));

  toggleExpand(): void {
    this.expanded.update((v) => !v);
  }

  openAddSubtask(): void {
    const data: TaskTemplateFormDialogData = {
      parentId: this.task.id,
      title: 'Nouveau sous-type',
    };
    const ref = this.dialog.open(TaskTemplateFormDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data,
    });
    ref.afterClosed().subscribe((r: TaskTemplateFormDialogResult | undefined) => {
      if (!r) {
        return;
      }
      this.ui.create(r).subscribe({
        next: () => {
          this.ui.load();
          this.expanded.set(true);
          this.snack.open('Sous-type créé', 'OK', { duration: 2200 });
        },
        error: (e) =>
          this.snack.open(e.error?.message || 'Erreur', 'OK', { duration: 4000 }),
      });
    });
  }

  deleteSelf(): void {
    if (
      !confirm(
        `Supprimer « ${this.task.name} » et tous les sous-types associés ?`,
      )
    ) {
      return;
    }
    this.ui.remove(this.task.id).subscribe({
      next: () => {
        this.ui.load();
        this.snack.open('Type de tâche supprimé', 'OK', { duration: 2200 });
      },
      error: (e) =>
        this.snack.open(e.error?.message || 'Erreur', 'OK', { duration: 4000 }),
    });
  }

  hasChildren(): boolean {
    return (this.task.children?.length ?? 0) > 0;
  }
}
