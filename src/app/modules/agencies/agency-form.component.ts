import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  selector: 'app-agency-form',
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
  templateUrl: './agency-form.component.html',
  styleUrl: './agency-form.component.scss',
})
export class AgencyFormComponent implements OnInit {
  loading = false;
  isEdit = false;
  agencyId: number | null = null;
  form: FormGroup;

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
      phone: [''],
      country: [''],
      city: [''],
      address: [''],
      status: ['ACTIVE'],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.agencyId = Number(id);
      this.isEdit = true;
      this.loadAgency();
    }
  }

  loadAgency(): void {
    if (this.agencyId == null) return;
    this.loading = true;
    this.http.get<{ name?: string; email?: string; phone?: string; country?: string; city?: string; address?: string; status?: string }>(this.api.agencies.byId(this.agencyId)).subscribe({
      next: (res) => {
        this.form.patchValue({
          name: res.name ?? '',
          email: res.email ?? '',
          phone: res.phone ?? '',
          country: res.country ?? '',
          city: res.city ?? '',
          address: res.address ?? '',
          status: res.status ?? 'ACTIVE',
        });
        this.loading = false;
      },
      error: () => {
        this.notif.error('Agence introuvable');
        this.loading = false;
        this.router.navigate(['/agencies']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      email: v.email,
      phone: v.phone || undefined,
      country: v.country || undefined,
      city: v.city || undefined,
      address: v.address || undefined,
      status: v.status || 'ACTIVE',
    };
    if (this.isEdit && this.agencyId != null) {
      this.http.put(this.api.agencies.byId(this.agencyId), body).subscribe({
        next: () => {
          this.notif.success('Agence mise à jour');
          this.router.navigate(['/agencies']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur lors de la mise à jour');
        },
      });
    } else {
      this.http.post(this.api.agencies.list, body).subscribe({
        next: () => {
          this.notif.success('Agence créée');
          this.router.navigate(['/agencies']);
        },
        error: (err) => {
          this.loading = false;
          this.notif.error(err.error?.message || 'Erreur lors de la création');
        },
      });
    }
  }
}
