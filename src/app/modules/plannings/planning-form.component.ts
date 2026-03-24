import { Component, OnInit, inject } from '@angular/core';
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
import { TaskTemplateNode } from '../task-templates/models/task-template-node.model';
import { TaskTemplatesUiService } from '../task-templates/task-templates-ui.service';

interface PlanningItemDto {
  id?: number;
  taskTemplateId: number;
  taskTemplateName?: string;
  durationMinutes?: number | null;
  sortOrder: number;
  /** Profondeur dans l’arbre (affichage seulement ; pas envoyé au serveur) */
  depth?: number;
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
  readonly taskTemplatesUi = inject(TaskTemplatesUiService);

  form: FormGroup;
  loading = false;
  isEdit = false;
  id: number | null = null;
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
    this.taskTemplatesUi.load();
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
    const roots = this.taskTemplatesUi.tree();
    const root = roots.find((t) => t.id === id);
    if (!root) return;
    const flat = this.flattenTaskTreeForPlanning(root);
    const start = this.selectedItems.length;
    flat.forEach((it, i) => {
      this.selectedItems.push({
        ...it,
        sortOrder: start + i,
      });
    });
    this.form.patchValue({ selectedTemplateId: null });
  }

  /** Parent puis sous-tâches (profondeur d’abord), pour coller à l’arbre des types de tâches. */
  private flattenTaskTreeForPlanning(node: TaskTemplateNode, depth = 0): PlanningItemDto[] {
    const row: PlanningItemDto = {
      taskTemplateId: node.id,
      taskTemplateName: node.name,
      durationMinutes: node.durationMinutes ?? null,
      sortOrder: 0,
      depth,
    };
    const out: PlanningItemDto[] = [row];
    for (const child of node.children ?? []) {
      out.push(...this.flattenTaskTreeForPlanning(child, depth + 1));
    }
    return out;
  }

  /** Durée totale (tâche + sous-tâches) pour le libellé du select. */
  subtreeMinutes(node: TaskTemplateNode): number {
    return this.taskTemplatesUi.subtreeTotalMinutes(node);
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
