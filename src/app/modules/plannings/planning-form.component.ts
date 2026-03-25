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
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { TaskTemplateNode } from '../task-templates/models/task-template-node.model';

interface PlanningItemDto {
  id?: number;
  taskTemplateId: number;
  taskTemplateName?: string;
  durationMinutes?: number | null;
  sortOrder: number;
  /** Profondeur dans le bloc tâche + sous-tâches (0 = tâche racine choisie); absent pour les items chargés depuis l’API. */
  treeDepth?: number;
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
    TranslatePipe,
  ],
  templateUrl: './planning-form.component.html',
  styleUrl: './planning-form.component.scss',
})
export class PlanningFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  isEdit = false;
  id: number | null = null;
  /** Racines seules — le sélecteur n’affiche pas les sous-tâches. */
  taskTemplateTree: TaskTemplateNode[] = [];
  selectedItems: PlanningItemDto[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private i18n: I18nService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      selectedTemplateId: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.http.get<TaskTemplateNode[]>(this.api.taskTemplates.tree).subscribe({
      next: (list) => (this.taskTemplateTree = Array.isArray(list) ? list.map((n) => this.normalizeTreeNode(n)) : []),
      error: () => (this.taskTemplateTree = []),
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
        error: () => this.notif.error(this.i18n.instant('plannings.notFound')),
      });
    }
  }

  /** Nombre de sous-tâches (descendants), pour l’intitulé du sélecteur. */
  descendantTaskCount(node: TaskTemplateNode): number {
    const children = node.children ?? [];
    let n = 0;
    for (const c of children) {
      n += 1 + this.descendantTaskCount(c);
    }
    return n;
  }

  addItem(): void {
    const id = this.form.get('selectedTemplateId')?.value as number | null;
    if (id == null) return;
    const root = this.taskTemplateTree.find((t) => t.id === id);
    if (!root) return;
    const rows = this.flattenTaskSubtree(root);
    const base = this.selectedItems.length;
    rows.forEach((row, i) => {
      row.sortOrder = base + i;
      this.selectedItems.push(row);
    });
    this.form.patchValue({ selectedTemplateId: null });
  }

  private normalizeTreeNode(raw: TaskTemplateNode): TaskTemplateNode {
    const children = (raw.children ?? []).map((c) => this.normalizeTreeNode(c));
    return { ...raw, children };
  }

  /** Préordre : tâche puis sous-tâches (ordre des enfants = API / tri nom). */
  private flattenTaskSubtree(root: TaskTemplateNode): PlanningItemDto[] {
    const out: PlanningItemDto[] = [];
    const walk = (node: TaskTemplateNode, depth: number) => {
      out.push({
        taskTemplateId: node.id,
        taskTemplateName: node.name,
        durationMinutes: node.durationMinutes ?? null,
        sortOrder: 0,
        treeDepth: depth,
      });
      for (const c of node.children ?? []) {
        walk(c, depth + 1);
      }
    };
    walk(root, 0);
    return out;
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
          this.notif.success(this.i18n.instant('plannings.saved'));
          this.router.navigate(['/plannings']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || this.i18n.instant('plannings.err'));
        },
      });
    } else {
      this.http.post(this.api.plannings.create, body).subscribe({
        next: () => {
          this.notif.success(this.i18n.instant('plannings.created'));
          this.router.navigate(['/plannings']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || this.i18n.instant('plannings.err'));
        },
      });
    }
  }
}
