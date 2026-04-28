import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { parseIsoDateString } from '../../shared/utils/date-form';

interface PaymentDueRow {
  id: number;
  paymentId?: number;
  dueDate?: string;
  amount: number;
  status: string;
  sequenceOrder?: number;
}

interface PaymentDetailDto {
  id: number;
  pilgrimName?: string | null;
  groupName?: string | null;
  amount: number;
  currency: string;
  paymentMethod?: string;
  status: string;
  paymentDate?: string;
  reference?: string;
  dueDates?: PaymentDueRow[];
}

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DatePipe,
    DecimalPipe,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss'],
})
export class PaymentDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  payment: PaymentDetailDto | null = null;
  loading = true;
  loadError = false;
  markingDueId: number | null = null;

  paymentId = 0;

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;
    if (Number.isNaN(id)) {
      this.loading = false;
      this.loadError = true;
      return;
    }
    this.paymentId = id;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.http.get<PaymentDetailDto>(this.api.payments.byId(this.paymentId)).subscribe({
      next: (p) => {
        this.payment = p;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
        this.notif.error(this.i18n.instant('payments.detail.loadError'));
      },
    });
  }

  sumPaid(): number {
    const dues = this.payment?.dueDates ?? [];
    return dues.filter((d) => d.status === 'PAID').reduce((s, d) => s + Number(d.amount || 0), 0);
  }

  sumRemaining(): number {
    const dues = this.payment?.dueDates ?? [];
    return dues.filter((d) => d.status === 'PENDING').reduce((s, d) => s + Number(d.amount || 0), 0);
  }

  hasInstallments(): boolean {
    return (this.payment?.dueDates?.length ?? 0) > 0;
  }

  showMarkPaid(d: PaymentDueRow): boolean {
    return this.payment?.status === 'PARTIAL' && d.status === 'PENDING';
  }

  dueDateLabel(s: string | undefined): string {
    const d = parseIsoDateString(s ?? '');
    if (!d) return '—';
    return d.toLocaleDateString();
  }

  markDuePaid(due: PaymentDueRow): void {
    if (!this.payment || this.markingDueId != null) return;
    this.markingDueId = due.id;
    this.http.post<PaymentDetailDto>(this.api.payments.markDuePaid(this.payment.id, due.id), {}).subscribe({
      next: (updated) => {
        this.payment = updated;
        this.markingDueId = null;
        this.notif.success(this.i18n.instant('payments.detail.markPaidSuccess'));
      },
      error: (err) => {
        this.markingDueId = null;
        this.notif.error(err.error?.message ?? this.i18n.instant('payments.detail.markPaidError'));
      },
    });
  }

  methodLabel(m: string | undefined): string {
    const labels: Record<string, string> = {
      CASH: this.i18n.instant('payments.form.methodCash'),
      BANK_TRANSFER: this.i18n.instant('payments.form.methodTransfer'),
      CARD: this.i18n.instant('payments.form.methodCard'),
    };
    return m ? labels[m] ?? m : '—';
  }

  statusLabel(s: string | undefined): string {
    const keys: Record<string, string> = {
      PENDING: 'payment.status.PENDING',
      PAID: 'payment.status.PAID',
      PARTIAL: 'payment.status.PARTIAL',
      REFUNDED: 'payment.status.REFUNDED',
    };
    if (!s) return '—';
    const k = keys[s];
    return k ? this.i18n.instant(k) : s;
  }

  dueStatusLabel(st: string): string {
    return st === 'PAID'
      ? this.i18n.instant('payments.detail.duePaid')
      : this.i18n.instant('payments.detail.duePending');
  }
}
