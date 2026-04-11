import { Component, OnInit, inject } from '@angular/core';
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
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { toIsoDateString } from '../../shared/utils/date-form';

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
    MatDatepickerModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './group-form.component.html',
  styleUrl: './group-form.component.scss',
})
export class GroupFormComponent implements OnInit {
  readonly auth = inject(AuthService);
  loading = false;
  form: FormGroup;
  plannings: PlanningOption[] = [];
  companions: CompanionOption[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private i18n: I18nService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      departureDate: [null as Date | null],
      returnDate: [null as Date | null],
      maxCapacity: [null as number | null],
      price: [null as number | null],
      planningId: [null as number | null],
      status: ['OPEN'],
      companionIds: [[] as number[]],
    });
  }

  ngOnInit(): void {
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
    const agency = this.auth.agency();
    if (!agency?.id) {
      this.notif.error(this.i18n.instant('groups.form.agencyMissing'));
      return;
    }
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
      agencyId: number;
      companionIds?: number[];
    } = {
      name: v.name,
      description: v.description || undefined,
      departureDate: toIsoDateString(v.departureDate as Date | null),
      returnDate: toIsoDateString(v.returnDate as Date | null),
      maxCapacity: v.maxCapacity != null ? Number(v.maxCapacity) : undefined,
      price: v.price != null ? Number(v.price) : undefined,
      planningId: v.planningId != null ? Number(v.planningId) : undefined,
      status: v.status || 'OPEN',
      agencyId: agency.id,
      companionIds: Array.isArray(v.companionIds) && v.companionIds.length > 0 ? v.companionIds : undefined,
    };
    this.http.post(this.api.groups.list, body).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('groups.form.created'));
        this.router.navigate(['/groups']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('groups.form.createError'));
      },
    });
  }
}
