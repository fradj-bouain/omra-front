import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { forkJoin } from 'rxjs';
import { agencyCountryLabel } from '../../shared/data/agency-countries';
import type { AgencySubDto, SubAgencyQuotaDto } from './agency-sub.dto';
import {
  SubAgencyFormDialogComponent,
  type SubAgencyFormDialogData,
} from './sub-agency-form-dialog.component';

@Component({
  selector: 'app-sub-agencies-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    TranslatePipe,
  ],
  templateUrl: './sub-agencies-page.component.html',
  styleUrl: './sub-agencies-page.component.scss',
})
export class SubAgenciesPageComponent implements OnInit {
  /** Affichage liste : libellé si code ISO connu, sinon valeur brute. */
  countryLabel = agencyCountryLabel;

  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

  subAgencies: AgencySubDto[] = [];
  subAgencyQuota: SubAgencyQuotaDto | null = null;
  loading = false;
  deactivatingSubId: number | null = null;

  ngOnInit(): void {
    this.loadSubAgencies();
  }

  loadSubAgencies(): void {
    const id = this.auth.agency()?.id;
    if (!id) return;
    this.loading = true;
    forkJoin({
      list: this.http.get<AgencySubDto[]>(this.api.agencies.subAgencies(id)),
      quota: this.http.get<SubAgencyQuotaDto>(this.api.agencies.subAgencyQuota(id)),
    }).subscribe({
      next: ({ list, quota }) => {
        this.subAgencies = list;
        this.subAgencyQuota = quota;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notif.error(this.i18n.instant('settings.subAgencies.loadError'));
      },
    });
  }

  openCreate(): void {
    const parentId = this.auth.agency()?.id;
    if (parentId == null) return;
    const ref = this.dialog.open(SubAgencyFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: { mode: 'create', parentId } satisfies SubAgencyFormDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadSubAgencies();
    });
  }

  openEdit(row: AgencySubDto): void {
    const ref = this.dialog.open(SubAgencyFormDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      data: { mode: 'edit', agencyId: row.id } satisfies SubAgencyFormDialogData,
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.loadSubAgencies();
    });
  }

  deactivateSub(row: AgencySubDto): void {
    if (row.status === 'SUSPENDED' || row.id == null) {
      return;
    }
    if (!window.confirm(this.i18n.instant('settings.subAgencies.deactivateConfirm'))) {
      return;
    }
    const parentId = this.auth.agency()?.id;
    if (!parentId) {
      return;
    }
    this.deactivatingSubId = row.id;
    this.http.post<AgencySubDto>(this.api.agencies.deactivateSubAgency(parentId, row.id), {}).subscribe({
      next: () => {
        this.deactivatingSubId = null;
        this.notif.success(this.i18n.instant('settings.subAgencies.deactivated'));
        this.loadSubAgencies();
      },
      error: () => {
        this.deactivatingSubId = null;
        this.notif.error(this.i18n.instant('settings.subAgencies.deactivateError'));
      },
    });
  }
}
