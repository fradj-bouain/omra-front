import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface TaskTemplateFormDialogData {
  parentId: number | null;
  title: string;
}

export interface TaskTemplateFormDialogResult {
  name: string;
  description: string;
  durationMinutes: number | null;
  parentId: number | null;
}

@Component({
  selector: 'app-task-template-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './task-template-form-dialog.component.html',
  styleUrl: './task-template-form-dialog.component.scss',
})
export class TaskTemplateFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(
    MatDialogRef<
      TaskTemplateFormDialogComponent,
      TaskTemplateFormDialogResult | undefined
    >,
  );
  readonly data = inject<TaskTemplateFormDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(128)]],
    description: [''],
    durationMinutes: [null as number | null],
  });

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.dialogRef.close({
      name: v.name.trim(),
      description: (v.description ?? '').trim(),
      durationMinutes:
        v.durationMinutes === null || v.durationMinutes === undefined
          ? null
          : Number(v.durationMinutes),
      parentId: this.data.parentId,
    });
  }
}
