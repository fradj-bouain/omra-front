import { Component, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

export interface DashboardStats {
  totalPilgrims: number;
  activeGroups: number;
  pendingVisas: number;
  paymentsReceived: number;
  totalRevenue: number;
}

export interface DashboardGroupKpi {
  groupId: number;
  groupName: string;
  filledCapacity: number;
  maxCapacity: number;
  totalPaid: number;
  price: number;
  status: string;
}

export interface DashboardChartDto {
  paymentsOverTime: { period: string; amount: number }[];
  visaDistribution: { status: string; count: number }[];
}

/** GET /api/transport-operator/dashboard — agences TRANSPORT uniquement. */
export interface TransportDashboardDto {
  vehiclesCount: number;
  offersCount: number;
  activeOffersCount: number;
  reservationsPending: number;
  reservationsConfirmed: number;
  reservationsRejected: number;
  reservationsTotal: number;
  recentReservations: Array<{
    id: number;
    contactName: string;
    status: string;
    createdAt: string;
    units: number | null;
    travelAgencyName: string | null;
  }>;
}

/** GET /api/hotel-operator/dashboard — agences HOTEL uniquement. */
export interface HotelDashboardDto {
  propertiesCount: number;
  offersCount: number;
  activeOffersCount: number;
  reservationsPending: number;
  reservationsConfirmed: number;
  reservationsRejected: number;
  reservationsTotal: number;
  recentReservations: Array<{
    id: number;
    contactName: string;
    status: string;
    createdAt: string;
    units: number | null;
    travelAgencyName: string | null;
  }>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    TranslatePipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  groupKpis: DashboardGroupKpi[] = [];
  chartData: DashboardChartDto | null = null;
  hotelDashboard: HotelDashboardDto | null = null;
  transportDashboard: TransportDashboardDto | null = null;
  loading = true;
  displayedColumns = ['groupName', 'filledCapacity', 'maxCapacity', 'totalPaid', 'price', 'status'];
  readonly displayedHotelRecentColumns = ['contactName', 'travelAgencyName', 'units', 'status', 'createdAt'];
  readonly displayedTransportRecentColumns = ['contactName', 'travelAgencyName', 'units', 'status', 'createdAt'];

  readonly isHotelDashboard = computed(() => this.auth.agency()?.agencyKind === 'HOTEL');
  readonly isTransportDashboard = computed(() => this.auth.agency()?.agencyKind === 'TRANSPORT');

  constructor(
    private http: HttpClient,
    private api: ApiService,
    readonly auth: AuthService
  ) {}

  /** Chart palette – same as CSS --chart-1 … --chart-6 */
  private readonly chartColors = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#65a30d'];

  getChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  getPaymentBarPct(amount: number): number {
    if (!this.chartData?.paymentsOverTime?.length) return 0;
    const max = Math.max(...this.chartData.paymentsOverTime.map((x) => x.amount), 1);
    return Math.min(100, (amount / max) * 100);
  }

  ngOnInit(): void {
    if (this.isHotelDashboard()) {
      this.http.get<HotelDashboardDto>(this.api.hotelOperator.dashboard).subscribe({
        next: (data) => {
          this.hotelDashboard = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
      return;
    }

    if (this.isTransportDashboard()) {
      this.http.get<TransportDashboardDto>(this.api.transportOperator.dashboard).subscribe({
        next: (data) => {
          this.transportDashboard = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
      return;
    }

    this.http.get<DashboardStats>(this.api.dashboard.stats).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
    this.http.get<DashboardGroupKpi[]>(this.api.dashboard.groupKpis).subscribe({
      next: (data) => (this.groupKpis = data || []),
      error: () => {},
    });
    this.http.get<DashboardChartDto>(this.api.dashboard.chartData).subscribe({
      next: (data) => (this.chartData = data),
      error: () => {},
    });
  }
}
