import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface PilgrimDetail {
  id: number;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  address?: string;
  visaStatus?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-pilgrim-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatCardModule, MatIconModule, MatButtonModule, PageHeaderComponent],
  templateUrl: './pilgrim-detail.component.html',
  styleUrl: './pilgrim-detail.component.scss',
})
export class PilgrimDetailComponent implements OnInit {
  pilgrim: PilgrimDetail | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private api: ApiService,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID manquant';
      this.loading = false;
      return;
    }
    const numId = Number(id);
    if (isNaN(numId)) {
      this.error = 'ID invalide';
      this.loading = false;
      return;
    }
    this.http.get<PilgrimDetail>(this.api.pilgrims.byId(numId)).subscribe({
      next: (res) => {
        this.pilgrim = res;
        this.loading = false;
      },
      error: () => {
        this.notif.error('Pèlerin introuvable');
        this.loading = false;
        this.router.navigate(['/pilgrims']);
      },
    });
  }

  getVisaLabel(status: string | undefined): string {
    if (!status) return '—';
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Refusé',
    };
    return labels[status] ?? status;
  }

  getGenderLabel(gender: string | undefined): string {
    if (!gender) return '—';
    return gender === 'M' ? 'Homme' : gender === 'F' ? 'Femme' : gender;
  }

  deletePilgrim(): void {
    if (!this.pilgrim?.id || !confirm('Supprimer ce pèlerin ? Cette action est irréversible.')) return;
    this.http.delete(this.api.pilgrims.byId(this.pilgrim.id)).subscribe({
      next: () => {
        this.notif.success('Pèlerin supprimé');
        this.router.navigate(['/pilgrims']);
      },
      error: () => this.notif.error('Erreur lors de la suppression'),
    });
  }
}
