import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Hotel {
  id: number;
  name: string;
  city?: string;
  address?: string;
  country?: string;
  stars?: number;
  contactImportant?: string;
  contactPhone?: string;
  receptionPhone?: string;
  email?: string;
}

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatIconModule, PageHeaderComponent],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.scss',
})
export class HotelListComponent implements OnInit {
  dataSource: Hotel[] = [];
  displayedColumns = ['name', 'city', 'country', 'stars', 'receptionPhone', 'contactImportant'];
  loading = false;

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.http.get<Hotel[]>(this.api.hotels.list).subscribe({
      next: (data) => { this.dataSource = Array.isArray(data) ? data : []; this.loading = false; },
      error: () => this.loading = false,
    });
  }
}
