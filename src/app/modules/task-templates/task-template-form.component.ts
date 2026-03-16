import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-task-template-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './task-template-form.component.html',
})
export class TaskTemplateFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  isEdit = false;
  id: number | null = null;

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
      durationMinutes: [60, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.id = +idParam;
      this.isEdit = true;
      this.http.get(this.api.taskTemplates.byId(this.id)).subscribe({
        next: (t: any) => {
          this.form.patchValue({ name: t.name, durationMinutes: t.durationMinutes ?? 60 });
        },
        error: () => this.notif.error('Type introuvable'),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = { name: v.name.trim(), durationMinutes: Number(v.durationMinutes) || 0 };
    if (this.isEdit && this.id != null) {
      this.http.put(this.api.taskTemplates.update(this.id), body).subscribe({
        next: () => {
          this.notif.success('Type de tâche modifié');
          this.router.navigate(['/task-templates']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur');
        },
      });
    } else {
      this.http.post(this.api.taskTemplates.create, body).subscribe({
        next: () => {
          this.notif.success('Type de tâche créé');
          this.router.navigate(['/task-templates']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur');
        },
      });
    }
  }
}
