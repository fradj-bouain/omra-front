import { Component, Input } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface GroupHeaderModel {
  name: string;
  description?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  status: string;
}

@Component({
  selector: 'app-group-header',
  standalone: true,
  imports: [DatePipe, NgClass, MatIconModule],
  templateUrl: './group-header.component.html',
  styleUrl: './group-header.component.scss',
})
export class GroupHeaderComponent {
  @Input({ required: true }) group!: GroupHeaderModel;
  @Input() pilgrimCount = 0;

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'is-active';
    if (s === 'DRAFT') return 'is-draft';
    if (s === 'COMPLETED' || s === 'CLOSED') return 'is-done';
    return 'is-default';
  }
}
