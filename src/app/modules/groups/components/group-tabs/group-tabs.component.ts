import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group-tabs',
  standalone: true,
  imports: [MatTabsModule, MatIconModule],
  templateUrl: './group-tabs.component.html',
  styleUrl: './group-tabs.component.scss',
})
export class GroupTabsComponent {
  @Input() selectedIndex = 0;
  @Output() selectedIndexChange = new EventEmitter<number>();
}
