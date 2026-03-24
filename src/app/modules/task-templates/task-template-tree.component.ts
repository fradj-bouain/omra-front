import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  TASK_TEMPLATE_ROOT_DROP_LIST_ID,
  TaskTemplatesUiService,
} from './task-templates-ui.service';
import { TaskTemplateItemComponent } from './task-template-item.component';
import {
  TaskTemplateFormDialogComponent,
  TaskTemplateFormDialogData,
  TaskTemplateFormDialogResult,
} from './task-template-form-dialog.component';

@Component({
  selector: 'app-task-template-tree',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DragDropModule,
    PageHeaderComponent,
    TaskTemplateItemComponent,
  ],
  templateUrl: './task-template-tree.component.html',
  styleUrl: './task-template-tree.component.scss',
})
export class TaskTemplateTreeComponent implements OnInit {
  readonly ui = inject(TaskTemplatesUiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly rootListId = TASK_TEMPLATE_ROOT_DROP_LIST_ID;

  ngOnInit(): void {
    this.ui.load();
  }

  openAddRoot(): void {
    const data: TaskTemplateFormDialogData = {
      parentId: null,
      title: 'Nouveau type de tâche',
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
          this.snack.open('Type de tâche créé', 'OK', { duration: 2400 });
        },
        error: (e) =>
          this.snack.open(e.error?.message || 'Erreur à la création', 'OK', {
            duration: 4500,
          }),
      });
    });
  }
}
