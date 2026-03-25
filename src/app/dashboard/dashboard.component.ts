import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, MatCardModule, MatIconModule, MatTableModule, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  groupKpis: DashboardGroupKpi[] = [];
  chartData: DashboardChartDto | null = null;
  loading = true;
  displayedColumns = ['groupName', 'filledCapacity', 'maxCapacity', 'totalPaid', 'price', 'status'];

  constructor(
    private http: HttpClient,
    private api: ApiService
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
