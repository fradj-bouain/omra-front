import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface TaskTemplate {
  id: number;
  name: string;
  durationMinutes?: number | null;
}

interface PlanningItemDto {
  id?: number;
  taskTemplateId: number;
  taskTemplateName?: string;
  durationMinutes?: number | null;
  sortOrder: number;
}

@Component({
  selector: 'app-planning-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatListModule,
    PageHeaderComponent,
  ],
  templateUrl: './planning-form.component.html',
  styleUrl: './planning-form.component.scss',
})
export class PlanningFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  isEdit = false;
  id: number | null = null;
  taskTemplates: TaskTemplate[] = [];
  selectedItems: PlanningItemDto[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      selectedTemplateId: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.http.get<TaskTemplate[]>(this.api.taskTemplates.list).subscribe({
      next: (list) => (this.taskTemplates = Array.isArray(list) ? list : []),
      error: () => (this.taskTemplates = []),
    });
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.id = +idParam;
      this.isEdit = true;
      this.http.get(this.api.plannings.byId(this.id)).subscribe({
        next: (p: any) => {
          this.form.patchValue({ name: p.name, description: p.description ?? '' });
          this.selectedItems = (p.items || []).map((it: any, i: number) => ({
            taskTemplateId: it.taskTemplateId,
            taskTemplateName: it.taskTemplateName,
            durationMinutes: it.durationMinutes,
            sortOrder: it.sortOrder ?? i,
          }));
        },
        error: () => this.notif.error('Planning introuvable'),
      });
    }
  }

  addItem(): void {
    const id = this.form.get('selectedTemplateId')?.value as number | null;
    if (id == null) return;
    const tt = this.taskTemplates.find((t) => t.id === id);
    if (!tt) return;
    this.selectedItems.push({
      taskTemplateId: tt.id,
      taskTemplateName: tt.name,
      durationMinutes: tt.durationMinutes ?? null,
      sortOrder: this.selectedItems.length,
    });
    this.form.patchValue({ selectedTemplateId: null });
  }

  removeItem(index: number): void {
    this.selectedItems.splice(index, 1);
    this.selectedItems.forEach((it, i) => (it.sortOrder = i));
  }

  moveUp(index: number): void {
    if (index <= 0) return;
    [this.selectedItems[index - 1], this.selectedItems[index]] = [this.selectedItems[index], this.selectedItems[index - 1]];
    this.selectedItems.forEach((it, i) => (it.sortOrder = i));
  }

  moveDown(index: number): void {
    if (index >= this.selectedItems.length - 1) return;
    [this.selectedItems[index], this.selectedItems[index + 1]] = [this.selectedItems[index + 1], this.selectedItems[index]];
    this.selectedItems.forEach((it, i) => (it.sortOrder = i));
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      name: v.name.trim(),
      description: v.description?.trim() || null,
      items: this.selectedItems.map((it, i) => ({ taskTemplateId: it.taskTemplateId, sortOrder: i })),
    };
    if (this.isEdit && this.id != null) {
      this.http.put(this.api.plannings.update(this.id), body).subscribe({
        next: () => {
          this.notif.success('Planning modifié');
          this.router.navigate(['/plannings']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur');
        },
      });
    } else {
      this.http.post(this.api.plannings.create, body).subscribe({
        next: () => {
          this.notif.success('Planning créé');
          this.router.navigate(['/plannings']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur');
        },
      });
    }
  }
}
