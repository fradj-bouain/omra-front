import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface AgencyOption {
  id: number;
  name: string;
}

interface PlanningOption {
  id: number;
  name: string;
}

interface CompanionOption {
  id: number;
  name: string;
  email?: string;
}

@Component({
  selector: 'app-group-form',
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
  templateUrl: './group-form.component.html',
  styleUrl: './group-form.component.scss',
})
export class GroupFormComponent implements OnInit {
  loading = false;
  form: FormGroup;
  /** Liste des agences (chargée pour super admin). */
  agencies: AgencyOption[] = [];
  /** Liste des plannings (pour assigner au groupe). */
  plannings: PlanningOption[] = [];
  /** Utilisateurs rôle Accompagnateur (PILGRIM_COMPANION) pour affectation au groupe. */
  companions: CompanionOption[] = [];
  /** True si connecté en tant qu'admin plateforme (super admin). */
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private notif: NotificationService,
    private router: Router
  ) {
    this.isSuperAdmin = this.auth.isAdmin();
    const needAgency = this.auth.isAdmin();
    this.form = this.fb.group({
      agencyId: [null as number | null, needAgency ? Validators.required : []],
      name: ['', Validators.required],
      description: [''],
      departureDate: [''],
      returnDate: [''],
      maxCapacity: [null as number | null],
      price: [null as number | null],
      planningId: [null as number | null],
      status: ['OPEN'],
      companionIds: [[] as number[]],
    });
  }

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.http.get<{ content: AgencyOption[] }>(`${this.api.agencies.list}?page=0&size=500`).subscribe({
        next: (res) => (this.agencies = res.content ?? []),
        error: () => (this.agencies = []),
      });
    }
    this.http.get<PlanningOption[]>(this.api.plannings.list).subscribe({
      next: (res) => (this.plannings = Array.isArray(res) ? res : []),
      error: () => (this.plannings = []),
    });
    this.http
      .get<{ content: CompanionOption[] }>(`${this.api.users.list}?page=1&size=500&role=PILGRIM_COMPANION`)
      .subscribe({
        next: (res) => (this.companions = res.content ?? []),
        error: () => (this.companions = []),
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body: {
      name: string;
      description?: string;
      departureDate?: string;
      returnDate?: string;
      maxCapacity?: number;
      price?: number;
      planningId?: number | null;
      status: string;
      agencyId?: number;
      companionIds?: number[];
    } = {
      name: v.name,
      description: v.description || undefined,
      departureDate: v.departureDate || undefined,
      returnDate: v.returnDate || undefined,
      maxCapacity: v.maxCapacity != null ? Number(v.maxCapacity) : undefined,
      price: v.price != null ? Number(v.price) : undefined,
      planningId: v.planningId != null ? Number(v.planningId) : undefined,
      status: v.status || 'OPEN',
      companionIds: Array.isArray(v.companionIds) && v.companionIds.length > 0 ? v.companionIds : undefined,
    };
    if (this.isSuperAdmin && v.agencyId != null) {
      body.agencyId = Number(v.agencyId);
    } else if (!this.isSuperAdmin && this.auth.agency()) {
      body.agencyId = this.auth.agency()!.id;
    }
    this.http.post(this.api.groups.list, body).subscribe({
      next: () => {
        this.notif.success('Groupe créé');
        this.router.navigate(['/groups']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
