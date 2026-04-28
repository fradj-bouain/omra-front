import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../core/services/api.service';
import { I18nService } from '../../core/services/i18n.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { FormInitialLoadComponent } from '../../shared/components/form-initial-load/form-initial-load.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { parseIsoDateString, toIsoDateString } from '../../shared/utils/date-form';

interface GroupOption {
  id: number;
  name: string;
}

interface PilgrimOption {
  id: number;
  firstName: string;
  lastName: string;
}

/** Ligne d'échéance (aperçu avant enregistrement, ou chargement édition). */
interface DuePreviewRow {
  /** Présent après chargement API ; absent pour une ligne nouvellement générée. */
  id?: number | null;
  dueDate: Date | null;
  amount: number | null;
  sequenceOrder: number;
  status?: string | null;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
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
    FormInitialLoadComponent,
  ],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./due-cheque-cards.scss', './payment-form.component.scss'],
})
export class PaymentFormComponent implements OnInit {
  initialLoading = false;
  saving = false;
  readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  form: FormGroup;
  pilgrimDisplay = new FormControl('', { validators: Validators.required });
  groupDisplay = new FormControl('', { validators: Validators.required });
  groups: GroupOption[] = [];
  pilgrims: PilgrimOption[] = [];
  editingId: number | null = null;

  /** Échéances affichées en cartes (pas générées côté serveur tant que l'utilisateur n'a pas cliqué sur Générer). */
  duePreviewRows: DuePreviewRow[] = [];

  /**
   * Si true : l'utilisateur a modifié au moins un montant d'échéance à la main — on ne répartit plus
   * automatiquement depuis le champ « Montant » (le montant principal ne bouge jamais ; les lignes non plus tant qu'il ne clique pas « Répartir » ou ne régénère pas).
   */
  private installmentAmountsCustomized = false;

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
      duePeriodDays: [30, [Validators.min(1)]],
      numberOfInstallments: [2, [Validators.min(2)]],
    });
  }

  get isPartial(): boolean {
    return this.form.get('status')?.value === 'PARTIAL';
  }

  /** Somme des montants des lignes d'aperçu (pour contrôle visuel). */
  duePreviewSum(): number {
    return this.duePreviewRows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }

  /** Écart entre total paiement et somme des échéances. */
  dueSumMatchesTotal(): boolean {
    const total = Number(this.form.get('amount')?.value);
    if (!this.isPartial || !total || this.duePreviewRows.length < 2) return true;
    return Math.abs(this.duePreviewSum() - total) < 0.021;
  }

  ngOnInit(): void {
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (idRaw) {
      const id = Number(idRaw);
      if (!isNaN(id)) {
        this.editingId = id;
        this.initialLoading = true;
        this.http.get<any>(this.api.payments.byId(id)).subscribe({
          next: (p) => {
            this.form.patchValue(
              {
                pilgrimId: p?.pilgrimId ?? null,
                groupId: p?.groupId ?? null,
                amount: p?.amount ?? null,
                currency: p?.currency ?? this.auth.agencyCurrency(),
                paymentMethod: p?.paymentMethod ?? 'CASH',
                status: p?.status ?? 'PENDING',
                reference: p?.reference ?? '',
                paymentDate: p?.paymentDate ? new Date(p.paymentDate) : null,
                firstDueDate: p?.firstDueDate ? new Date(p.firstDueDate) : null,
                duePeriodDays: p?.duePeriodDays != null ? Number(p.duePeriodDays) : 30,
                numberOfInstallments:
                  p?.numberOfInstallments != null ? Number(p.numberOfInstallments) : 2,
              },
              { emitEvent: false }
            );
            if (p?.status === 'PARTIAL' && Array.isArray(p.dueDates) && p.dueDates.length > 0) {
              this.installmentAmountsCustomized = true;
              this.duePreviewRows = [...p.dueDates]
                .sort(
                  (a: { sequenceOrder?: number }, b: { sequenceOrder?: number }) =>
                    (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
                )
                .map(
                  (
                    d: {
                      id?: number;
                      dueDate?: string;
                      amount?: number;
                      sequenceOrder?: number;
                      status?: string;
                    },
                    i: number
                  ): DuePreviewRow => ({
                    id: d.id ?? undefined,
                    dueDate: parseIsoDateString(d.dueDate ?? '') ?? null,
                    amount: d.amount != null ? Number(d.amount) : null,
                    sequenceOrder: d.sequenceOrder ?? i + 1,
                    status: d.status ?? 'PENDING',
                  })
                );
            }
            this.initialLoading = false;
          },
          error: () => {
            this.initialLoading = false;
            this.notif.error('Impossible de charger le paiement');
          },
        });
      }
    }

    this.http.get<{ content: GroupOption[] }>(`${this.api.groups.list}?page=1&size=500`).subscribe({
      next: (res) => {
        this.groups = res.content || [];
        const gid = this.route.snapshot.queryParamMap.get('groupId');
        if (gid) {
          const gidNum = Number(gid);
          const g = this.groups.find((x) => x.id === gidNum);
          if (g) {
            this.form.patchValue({ groupId: gidNum });
            this.groupDisplay.setValue(g.name, { emitEvent: false });
          }
        }
        const gidEdit = this.form.get('groupId')?.value;
        if (this.editingId && gidEdit) {
          const g = this.groups.find((x) => x.id === gidEdit);
          if (g) this.groupDisplay.setValue(g.name, { emitEvent: false });
        }
      },
      error: () => {},
    });
    this.http.get<{ content: PilgrimOption[] }>(`${this.api.pilgrims.list}?page=1&size=500`).subscribe({
      next: (res) => {
        this.pilgrims = res.content || [];
        const pid = this.form.get('pilgrimId')?.value;
        if (pid) {
          const p = this.pilgrims.find((x) => x.id === pid);
          if (p) this.pilgrimDisplay.setValue(`${p.firstName} ${p.lastName}`, { emitEvent: false });
        }
      },
      error: () => {},
    });
    this.pilgrimDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ pilgrimId: null }, { emitEvent: false });
    });
    this.groupDisplay.valueChanges.subscribe((v) => {
      if (v === '' || v == null) this.form.patchValue({ groupId: null }, { emitEvent: false });
    });
    this.form.get('status')?.valueChanges.subscribe((status) => {
      if (status !== 'PARTIAL') {
        this.duePreviewRows = [];
        this.installmentAmountsCustomized = false;
      }
    });

    /** Montant principal = référence : répartition égale sur les échéances déjà affichées (sans toucher au champ montant). */
    this.form.get('amount')?.valueChanges.subscribe(() => {
      if (!this.isPartial || this.duePreviewRows.length < 2 || this.installmentAmountsCustomized) return;
      const total = Number(this.form.get('amount')?.value);
      if (!total || total <= 0 || Number.isNaN(total)) return;
      const amounts = this.splitAmountEqually(total, this.duePreviewRows.length);
      this.duePreviewRows = this.duePreviewRows.map((r, i) => ({
        ...r,
        amount: amounts[i] ?? r.amount,
      }));
    });
  }

  get filteredPilgrims(): PilgrimOption[] {
    const q = (this.pilgrimDisplay.value ?? '').toString().toLowerCase();
    if (!q) return this.pilgrims.slice(0, 50);
    const name = (pil: PilgrimOption) => `${pil.firstName} ${pil.lastName}`.toLowerCase();
    return this.pilgrims.filter((pil) => name(pil).includes(q)).slice(0, 50);
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

  /** Répartition sans erreur d’arrondi (centimes). */
  splitAmountEqually(total: number, n: number): number[] {
    const cents = Math.round(total * 100);
    const base = Math.floor(cents / n);
    const rem = cents % n;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      out.push((base + (i < rem ? 1 : 0)) / 100);
    }
    return out;
  }

  /** Construit l’aperçu des échéances (dates espacées + montants répartis). */
  generateSchedulePreview(): void {
    const v = this.form.getRawValue();
    const n = Math.floor(Number(v.numberOfInstallments));
    const period = Math.floor(Number(v.duePeriodDays));
    const first = v.firstDueDate as Date | null;
    const total = Number(v.amount);
    if (!first || !(first instanceof Date) || Number.isNaN(first.getTime())) {
      this.notif.error(this.i18n.instant('payments.form.partial.needFirstDate'));
      return;
    }
    if (n < 2 || Number.isNaN(n)) {
      this.notif.error(this.i18n.instant('payments.form.partial.needInstallments'));
      return;
    }
    if (!period || period < 1) {
      this.notif.error(this.i18n.instant('payments.form.partial.needPeriod'));
      return;
    }
    if (!total || total <= 0 || Number.isNaN(total)) {
      this.notif.error(this.i18n.instant('payments.form.partial.needAmount'));
      return;
    }
    const amounts = this.splitAmountEqually(total, n);
    this.installmentAmountsCustomized = false;
    this.duePreviewRows = [];
    const base = new Date(first.getFullYear(), first.getMonth(), first.getDate());
    for (let i = 0; i < n; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i * period);
      this.duePreviewRows.push({
        dueDate: d,
        amount: amounts[i] ?? 0,
        sequenceOrder: i + 1,
        status: 'PENDING',
      });
    }
  }

  /** Vide la liste d’échéances pour régénérer après changement de montant, nombre, dates ou intervalle. */
  clearDuePreview(): void {
    this.duePreviewRows = [];
    this.installmentAmountsCustomized = false;
  }

  /** Recalcule les montants en parts égales en gardant les dates saisies. */
  redistributeAmountsEvenly(): void {
    const total = Number(this.form.get('amount')?.value);
    const n = this.duePreviewRows.length;
    if (!total || total <= 0 || n < 2) {
      this.notif.error(this.i18n.instant('payments.form.partial.needPreview'));
      return;
    }
    const amounts = this.splitAmountEqually(total, n);
    this.installmentAmountsCustomized = false;
    this.duePreviewRows = this.duePreviewRows.map((r, i) => ({
      ...r,
      amount: amounts[i] ?? r.amount,
    }));
  }

  dueDateToInputValue(d: Date | null): string {
    return toIsoDateString(d ?? undefined) ?? '';
  }

  onDueDateChange(index: number, ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    const rows = [...this.duePreviewRows];
    const row = rows[index];
    if (!row) return;
    row.dueDate = v ? parseIsoDateString(v) : null;
    this.duePreviewRows = rows;
  }

  onAmountChange(index: number, ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    const rows = [...this.duePreviewRows];
    const row = rows[index];
    if (!row) return;
    const n = parseFloat(v.replace(',', '.'));
    row.amount = Number.isFinite(n) ? n : null;
    this.installmentAmountsCustomized = true;
    this.duePreviewRows = rows;
  }

  onSubmit(): void {
    if (this.form.invalid || this.initialLoading || this.saving) return;
    const v = this.form.getRawValue();

    if (v.status === 'PARTIAL') {
      if (this.duePreviewRows.length < 2) {
        this.notif.error(this.i18n.instant('payments.form.partial.submitNeedTwo'));
        return;
      }
      if (!this.dueSumMatchesTotal()) {
        this.notif.error(this.i18n.instant('payments.form.partial.sumMismatch'));
        return;
      }
      for (const r of this.duePreviewRows) {
        if (!r.dueDate || r.amount == null || r.amount <= 0) {
          this.notif.error(this.i18n.instant('payments.form.partial.invalidRow'));
          return;
        }
      }
    }

    this.saving = true;
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
      const sorted = [...this.duePreviewRows].sort((a, b) => {
        const ta = a.dueDate?.getTime() ?? 0;
        const tb = b.dueDate?.getTime() ?? 0;
        return ta - tb;
      });
      body['dueDates'] = sorted.map((r, i) => {
        const row: Record<string, unknown> = {
          dueDate: toIsoDateString(r.dueDate),
          amount: Number(r.amount),
          sequenceOrder: i + 1,
          status: r.status || 'PENDING',
        };
        if (r.id != null && r.id !== undefined) {
          row['id'] = Number(r.id);
        }
        return row;
      });
      body['firstDueDate'] = toIsoDateString(sorted[0]?.dueDate ?? null);
      body['numberOfInstallments'] = sorted.length;
      body['duePeriodDays'] = v.duePeriodDays != null ? Number(v.duePeriodDays) : undefined;
    }

    const req$ = this.editingId
      ? this.http.put(this.api.payments.byId(this.editingId), body)
      : this.http.post(this.api.payments.list, body);
    req$.subscribe({
      next: () => {
        this.notif.success(this.editingId ? 'Paiement modifié' : 'Paiement créé');
        this.router.navigate(['/payments']);
      },
      error: (err) => {
        this.saving = false;
        this.notif.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }
}
