import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/services/api.service';
import { I18nService } from '../../core/services/i18n.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { switchMap } from 'rxjs';

interface RewardTier {
  id: number;
  agencyId: number;
  pointsThreshold: number;
  giftTitle: string;
  giftDescription?: string | null;
  sortOrder?: number | null;
}

interface CampaignSlotRow {
  rankOrder: number;
  rewardTierId: number;
  pointsThreshold: number | null;
  giftTitle: string | null;
  giftDescription: string | null;
}

interface CampaignWinnerRow {
  pilgrimId: number;
  pilgrimDisplayName: string;
  rankOrder: number;
  wonAt?: string;
  pointsAtWin: number;
  rewardTierId?: number | null;
  giftTitle?: string | null;
  giftDescription?: string | null;
}

interface CampaignDashboard {
  idle: boolean;
  campaignId?: number;
  title?: string | null;
  status?: string;
  startsAt?: string;
  endsAt?: string;
  maxWinners?: number;
  winnersCount: number;
  phase: string;
  slots: CampaignSlotRow[];
  winners: CampaignWinnerRow[];
}

interface CampaignHistoryRow {
  id: number;
  title?: string | null;
  startsAt: string;
  endsAt: string;
  maxWinners: number;
  status: string;
  createdAt?: string;
  closedAt?: string | null;
  slotRewardTierIds?: number[];
}

@Component({
  selector: 'app-referral',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTabsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './referral.component.html',
  styleUrl: './referral.component.scss',
})
export class ReferralComponent implements OnInit {
  pointsPerReferral: number | null = null;

  tiers: RewardTier[] = [];
  tiersLoading = true;
  tiersError: string | null = null;
  editingTierId: number | null = null;
  tierSaving = false;

  tierForm: FormGroup;

  dashboard: CampaignDashboard | null = null;
  dashboardLoading = true;
  dashboardError: string | null = null;

  campaignForm: FormGroup;
  campaignSaving = false;

  history: CampaignHistoryRow[] = [];
  historyLoading = false;
  historyFilterForm!: FormGroup;

  readonly tierColumns = ['pointsThreshold', 'giftTitle', 'giftDescription', 'actions'];

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private i18n: I18nService,
    private notif: NotificationService,
    private fb: FormBuilder
  ) {
    this.tierForm = this.fb.group({
      pointsThreshold: [50, [Validators.required, Validators.min(1)]],
      giftTitle: ['', Validators.required],
      giftDescription: [''],
      sortOrder: [0],
    });
    this.campaignForm = this.fb.group({
      title: [''],
      startsAt: ['', Validators.required],
      endsAt: ['', Validators.required],
      maxWinners: [3, [Validators.required, Validators.min(1), Validators.max(500)]],
      slotTiers: this.fb.array([]),
    });
    this.syncSlotTierControls(3);
    this.historyFilterForm = this.fb.group({
      status: ['ALL'],
      search: [''],
    });
  }

  /** Lignes d’historique après filtres (statut + texte titre / id). */
  get filteredHistory(): CampaignHistoryRow[] {
    const { status, search } = this.historyFilterForm.getRawValue() as { status: string; search: string };
    let rows = this.history;
    if (status && status !== 'ALL') {
      rows = rows.filter((h) => h.status === status);
    }
    const q = String(search ?? '')
      .trim()
      .toLowerCase();
    if (q) {
      rows = rows.filter((h) => {
        const title = (h.title ?? '').toLowerCase();
        return title.includes(q) || String(h.id).includes(q);
      });
    }
    return rows;
  }

  campaignStatusLabelKey(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'referral.campaign.statusActive',
      DRAFT: 'referral.campaign.statusDraft',
      CLOSED: 'referral.campaign.statusClosed',
    };
    return map[status] ?? status;
  }

  clearHistoryFilters(): void {
    this.historyFilterForm.reset({ status: 'ALL', search: '' });
  }

  get slotTiers(): FormArray {
    return this.campaignForm.get('slotTiers') as FormArray;
  }

  /** Ajuste le nombre de sélecteurs de palier au « nombre de gagnants ». */
  syncSlotTierControls(targetCount: number): void {
    const n = Math.min(500, Math.max(1, Math.floor(targetCount) || 1));
    const arr = this.slotTiers;
    while (arr.length < n) {
      arr.push(this.fb.control<number | null>(null, Validators.required));
    }
    while (arr.length > n) {
      arr.removeAt(arr.length - 1);
    }
  }

  onMaxWinnersChange(): void {
    const raw = Number(this.campaignForm.get('maxWinners')?.value);
    const n = Math.min(500, Math.max(1, Number.isFinite(raw) ? raw : 1));
    this.campaignForm.patchValue({ maxWinners: n }, { emitEvent: false });
    this.syncSlotTierControls(n);
  }

  ngOnInit(): void {
    this.loadConfig();
    this.loadTiers();
    this.loadDashboard();
    this.loadHistory();
  }

  phaseLabelKey(phase: string): string {
    const map: Record<string, string> = {
      IDLE: 'referral.campaign.phaseIdle',
      UPCOMING: 'referral.campaign.phaseUpcoming',
      LIVE: 'referral.campaign.phaseLive',
      ENDED_TIME: 'referral.campaign.phaseEndedTime',
      ENDED_FULL: 'referral.campaign.phaseEndedFull',
    };
    return map[phase] ?? phase;
  }

  loadConfig(): void {
    this.http.get<{ pointsPerReferral: number }>(this.api.pilgrimSponsorship.config).subscribe({
      next: (c) => {
        const n = c?.pointsPerReferral;
        this.pointsPerReferral = typeof n === 'number' && !Number.isNaN(n) ? n : null;
      },
      error: () => {
        this.pointsPerReferral = null;
      },
    });
  }

  loadDashboard(): void {
    this.dashboardLoading = true;
    this.dashboardError = null;
    this.http.get<CampaignDashboard>(this.api.referralCampaigns.dashboard).subscribe({
      next: (d) => {
        this.dashboard = {
          ...d,
          slots: d.slots ?? [],
          winners: d.winners ?? [],
        };
        this.dashboardLoading = false;
      },
      error: (err) => {
        this.dashboardLoading = false;
        this.dashboardError = err.error?.message || this.i18n.instant('referral.campaign.dashboardError');
      },
    });
  }

  loadHistory(): void {
    this.historyLoading = true;
    this.http.get<CampaignHistoryRow[]>(this.api.referralCampaigns.list).subscribe({
      next: (rows) => {
        this.history = rows || [];
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
      },
    });
  }

  loadTiers(): void {
    this.tiersLoading = true;
    this.tiersError = null;
    this.http.get<RewardTier[]>(this.api.referralRewardTiers.list).subscribe({
      next: (t) => {
        this.tiers = t || [];
        this.tiersLoading = false;
      },
      error: (err) => {
        this.tiersLoading = false;
        this.tiersError = err.error?.message || this.i18n.instant('referral.tiersLoadError');
      },
    });
  }

  createAndActivateCampaign(): void {
    if (this.campaignForm.invalid || this.campaignSaving) {
      this.campaignForm.markAllAsTouched();
      return;
    }
    if (this.tiers.length === 0) {
      this.notif.error(this.i18n.instant('referral.campaign.needTiersFirst'));
      return;
    }
    const v = this.campaignForm.getRawValue();
    const start = new Date(v.startsAt);
    const end = new Date(v.endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      this.notif.error(this.i18n.instant('referral.campaign.invalidDates'));
      return;
    }
    if (end <= start) {
      this.notif.error(this.i18n.instant('referral.campaign.endBeforeStart'));
      return;
    }
    const slotRewardTierIds = this.slotTiers.controls
      .map((c) => c.value)
      .filter((id): id is number => id != null && typeof id === 'number' && !Number.isNaN(id));
    if (slotRewardTierIds.length !== this.slotTiers.length) {
      this.slotTiers.markAllAsTouched();
      this.notif.error(this.i18n.instant('referral.campaign.slotTiersIncomplete'));
      return;
    }
    this.campaignSaving = true;
    const body = {
      title: String(v.title || '').trim() || undefined,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      slotRewardTierIds,
    };
    this.http
      .post<{ id: number }>(this.api.referralCampaigns.list, body)
      .pipe(switchMap((c) => this.http.post<{ id: number }>(this.api.referralCampaigns.activate(c.id), {})))
      .subscribe({
        next: () => {
          this.campaignSaving = false;
          this.notif.success(this.i18n.instant('referral.campaign.activated'));
          this.campaignForm.reset({ title: '', startsAt: '', endsAt: '', maxWinners: 3 });
          while (this.slotTiers.length) {
            this.slotTiers.removeAt(0);
          }
          this.syncSlotTierControls(3);
          this.loadDashboard();
          this.loadHistory();
        },
        error: (err) => {
          this.campaignSaving = false;
          this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
        },
      });
  }

  closeActiveCampaign(): void {
    const id = this.dashboard?.campaignId;
    if (id == null) return;
    if (!confirm(this.i18n.instant('referral.campaign.closeConfirm'))) return;
    this.http.post(this.api.referralCampaigns.close(id), {}).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('referral.campaign.closed'));
        this.loadDashboard();
        this.loadHistory();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric')),
    });
  }

  saveTier(): void {
    if (this.tierForm.invalid || this.tierSaving) return;
    this.tierSaving = true;
    const v = this.tierForm.getRawValue();
    const body = {
      pointsThreshold: Number(v.pointsThreshold),
      giftTitle: String(v.giftTitle).trim(),
      giftDescription: v.giftDescription?.trim() || undefined,
      sortOrder: v.sortOrder != null ? Number(v.sortOrder) : 0,
    };
    if (this.editingTierId != null) {
      this.http.put<RewardTier>(this.api.referralRewardTiers.update(this.editingTierId), body).subscribe({
        next: () => {
          this.notif.success(this.i18n.instant('referral.notifTierSaved'));
          this.cancelTierEdit();
          this.tierSaving = false;
          this.loadTiers();
        },
        error: (err) => {
          this.tierSaving = false;
          this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
        },
      });
    } else {
      this.http.post<RewardTier>(this.api.referralRewardTiers.list, body).subscribe({
        next: () => {
          this.notif.success(this.i18n.instant('referral.notifTierCreated'));
          this.tierForm.reset({ pointsThreshold: 50, giftTitle: '', giftDescription: '', sortOrder: 0 });
          this.tierSaving = false;
          this.loadTiers();
        },
        error: (err) => {
          this.tierSaving = false;
          this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric'));
        },
      });
    }
  }

  startEditTier(t: RewardTier): void {
    this.editingTierId = t.id;
    this.tierForm.patchValue({
      pointsThreshold: t.pointsThreshold,
      giftTitle: t.giftTitle,
      giftDescription: t.giftDescription ?? '',
      sortOrder: t.sortOrder ?? 0,
    });
  }

  cancelTierEdit(): void {
    this.editingTierId = null;
    this.tierForm.reset({ pointsThreshold: 50, giftTitle: '', giftDescription: '', sortOrder: 0 });
  }

  deleteTier(t: RewardTier): void {
    if (!confirm(this.i18n.instant('referral.confirmDeleteTier'))) return;
    this.http.delete(this.api.referralRewardTiers.delete(t.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('referral.notifTierDeleted'));
        if (this.editingTierId === t.id) this.cancelTierEdit();
        this.loadTiers();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('common.errorGeneric')),
    });
  }
}
