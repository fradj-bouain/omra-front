import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { toIsoDateString } from '../../shared/utils/date-form';

interface GroupOption {
  id: number;
  name: string;
}

interface PilgrimOption {
  id: number;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-payment-form',
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
    MatAutocompleteModule,
    MatDatepickerModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.scss',
})
export class PaymentFormComponent implements OnInit {
  loading = false;
  readonly auth = inject(AuthService);
  form: FormGroup;
  pilgrimDisplay = new FormControl('', { validators: Validators.required });
  groupDisplay = new FormControl('', { validators: Validators.required });
  groups: GroupOption[] = [];
  pilgrims: PilgrimOption[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      pilgrimId: [null as number | null, Validators.required],
      groupId: [null as number | null, Validators.required],
      amount: [null as number | null, Validators.required],
      currency: [this.auth.agencyCurrency()],
      paymentMethod: ['CASH'],
      status: ['PENDING'],
      paymentDate: [null as Date | null],
      reference: [''],
      firstDueDate: [null as Date | null],
      duePeriodDays: [30],
      numberOfInstallments: [2],
    });
  }

  get isPartial(): boolean {
    return this.form.get('status')?.value === 'PARTIAL';
  }

  ngOnInit(): void {
    this.http.get<{ content: GroupOption[] }>(`${this.api.groups.list}?page=1&size=500`).subscribe({
      next: (res) => {
        this.groups = res.content || [];
        const gid = this.route.snapshot.queryParamMap.get('groupId');
        if (gid) {
          const id = Number(gid);
          const g = this.groups.find((x) => x.id === id);
          if (g) {
            this.form.patchValue({ groupId: id });
            this.groupDisplay.setValue(g.name, { emitEvent: false });
          }
        }
      },
      error: () => {},
    });
    this.http.get<{ content: PilgrimOption[] }>(`${this.api.pilgrims.list}?page=1&size=500`).subscribe({
      next: (res) => (this.pilgrims = res.content || []),
      error: () => {},
    });
    this.pilgrimDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ pilgrimId: null }, { emitEvent: false });
    });
    this.groupDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ groupId: null }, { emitEvent: false });
    });
    this.form.get('status')?.valueChanges.subscribe((status) => {
      const firstDue = this.form.get('firstDueDate');
      const numInst = this.form.get('numberOfInstallments');
      if (status === 'PARTIAL') {
        firstDue?.setValidators([Validators.required]);
        numInst?.setValidators([Validators.required, Validators.min(2)]);
      } else {
        firstDue?.clearValidators();
        numInst?.clearValidators();
        numInst?.setValue(2);
      }
      firstDue?.updateValueAndValidity();
      numInst?.updateValueAndValidity();
    });
  }

  get filteredPilgrims(): PilgrimOption[] {
    const q = (this.pilgrimDisplay.value ?? '').toString().toLowerCase();
    if (!q) return this.pilgrims.slice(0, 50);
    const name = (p: PilgrimOption) => `${p.firstName} ${p.lastName}`.toLowerCase();
    return this.pilgrims.filter((p) => name(p).includes(q)).slice(0, 50);
  }

  get filteredGroups(): GroupOption[] {
    const q = (this.groupDisplay.value ?? '').toString().toLowerCase();
    if (!q) return this.groups.slice(0, 50);
    return this.groups.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 50);
  }

  selectPilgrim(p: PilgrimOption): void {
    this.form.patchValue({ pilgrimId: p.id });
    this.pilgrimDisplay.setValue(`${p.firstName} ${p.lastName}`, { emitEvent: false });
  }

  selectGroup(g: GroupOption): void {
    this.form.patchValue({ groupId: g.id });
    this.groupDisplay.setValue(g.name, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const v = this.form.getRawValue();
    const body: Record<string, unknown> = {
      pilgrimId: v.pilgrimId != null && v.pilgrimId !== '' ? Number(v.pilgrimId) : undefined,
      groupId: v.groupId != null && v.groupId !== '' ? Number(v.groupId) : undefined,
      amount: Number(v.amount),
      currency: v.currency || this.auth.agencyCurrency(),
      paymentMethod: v.paymentMethod || 'CASH',
      status: v.status || 'PENDING',
      paymentDate: toIsoDateString(v.paymentDate as Date | null),
      reference: v.reference || undefined,
    };
    if (v.status === 'PARTIAL') {
      body['firstDueDate'] = toIsoDateString(v['firstDueDate'] as Date | null);
      body['duePeriodDays'] = v['duePeriodDays'] != null ? Number(v['duePeriodDays']) : undefined;
      body['numberOfInstallments'] = v['numberOfInstallments'] != null ? Number(v['numberOfInstallments']) : undefined;
    }
    this.http.post(this.api.payments.list, body).subscribe({
      next: () => {
        this.notif.success('Paiement créé');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
