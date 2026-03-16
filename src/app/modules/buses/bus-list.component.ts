import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Bus {
  id: number;
  plate: string;
  capacity: number;
  driverName?: string | null;
  driverContact?: string | null;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

@Component({
  selector: 'app-bus-list',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatPaginatorModule, MatIconModule, PageHeaderComponent],
  templateUrl: './bus-list.component.html',
  styleUrl: './bus-list.component.scss',
})
export class BusListComponent implements OnInit {
  dataSource: Bus[] = [];
  displayedColumns = ['plate', 'capacity', 'driverName', 'driverContact'];
  totalElements = 0;
  page = 0;
  size = 20;
  loading = false;

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const url = `${this.api.buses.list}?page=${this.page}&size=${this.size}`;
    this.http.get<PageResponse<Bus>>(url).subscribe({
      next: (res) => {
        this.dataSource = res.content || [];
        this.totalElements = res.totalElements ?? 0;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.load();
  }
}
