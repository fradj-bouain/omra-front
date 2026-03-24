import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  rewardsGranted: number;
}

interface ReferralItem {
  id: number;
  referrerId: number;
  referredId: number;
  status: string;
  rewardGiven: boolean;
  rewardGrantedAt?: string;
  createdAt: string;
}

@Component({
  selector: 'app-referral',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './referral.component.html',
  styleUrl: './referral.component.scss',
})
export class ReferralComponent implements OnInit {
  stats: ReferralStats | null = null;
  referrals: ReferralItem[] = [];
  loading = true;
  error: string | null = null;
  grantingId: number | null = null;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.http.get<ReferralStats>(this.api.referral.stats).subscribe({
      next: (s) => {
        this.stats = s;
        // Override link with current app origin so copied link is correct when deployed
        if (typeof window !== 'undefined' && window.location?.origin && this.stats) {
          this.stats.referralLink = `${window.location.origin}/users/new?ref=${this.stats.referralCode}`;
        }
        this.loadReferrals();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Impossible de charger le parrainage';
      },
    });
  }

  loadReferrals(): void {
    this.http.get<ReferralItem[]>(this.api.referral.list).subscribe({
      next: (r) => {
        this.referrals = r || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  copyCode(): void {
    if (!this.stats?.referralCode) return;
    this.copyToClipboard(this.stats.referralCode);
    this.notif.success('Code copié');
  }

  copyLink(): void {
    if (!this.stats?.referralLink) return;
    this.copyToClipboard(this.stats.referralLink);
    this.notif.success('Lien copié');
  }

  private copyToClipboard(text: string): void {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  grantReward(r: ReferralItem): void {
    if (r.rewardGiven) return;
    this.grantingId = r.id;
    this.http.post(this.api.referral.grantReward(r.id), {}).subscribe({
      next: () => {
        this.notif.success('Récompense attribuée');
        this.grantingId = null;
        this.load();
      },
      error: (err) => {
        this.grantingId = null;
        this.notif.error(err.error?.message || 'Erreur');
      },
    });
  }

  getStatusLabel(status: string): string {
    return status === 'COMPLETED' ? 'Complété' : 'En attente';
  }
}
