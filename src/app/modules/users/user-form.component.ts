import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  loading = false;
  form: FormGroup;
  editingId: number | null = null;

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
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: [''],
      role: ['AGENCY_AGENT'],
      status: ['ACTIVE'],
      referralCodeAtSignup: [''],
    });
  }

  ngOnInit(): void {
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) {
        this.editingId = id;
        // Password optional when editing
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
        this.loading = true;
        this.http.get<any>(this.api.users.byId(id)).subscribe({
          next: (u) => {
            this.form.patchValue({
              name: u?.name ?? '',
              email: u?.email ?? '',
              phone: u?.phone ?? '',
              role: u?.role ?? 'AGENCY_AGENT',
              status: u?.status ?? 'ACTIVE',
            });
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.notif.error('Impossible de charger l’utilisateur');
          },
        });
      }
    }
    this.route.queryParams.subscribe((params) => {
      const ref = params['ref'];
      if (ref && typeof ref === 'string' && ref.trim()) {
        this.form.patchValue({ referralCodeAtSignup: ref.trim().toUpperCase() });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      name: v.name,
      email: v.email,
      phone: v.phone || undefined,
      role: v.role || 'AGENCY_AGENT',
      status: v.status || 'ACTIVE',
    };
    if (!this.editingId) {
      body['password'] = v.password;
    } else if (v.password && String(v.password).trim()) {
      body['password'] = String(v.password);
    }
    if (v.referralCodeAtSignup && String(v.referralCodeAtSignup).trim()) {
      body['referralCodeAtSignup'] = String(v.referralCodeAtSignup).trim().toUpperCase();
    }
    const req$ = this.editingId
      ? this.http.put(this.api.users.byId(this.editingId), body)
      : this.http.post(this.api.users.list, body);
    req$.subscribe({
      next: () => {
        this.notif.success(this.editingId ? 'Utilisateur modifié' : 'Utilisateur créé');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
