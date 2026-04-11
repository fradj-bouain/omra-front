import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-group-stats',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, TranslatePipe],
  templateUrl: './group-stats.component.html',
  styleUrl: './group-stats.component.scss',
})
export class GroupStatsComponent {
  @Input() totalPilgrims = 0;
  @Input() paymentsReceived = 0;
  @Input() paymentsCurrency = 'MAD';
  @Input() pendingVisas = 0;
  @Input() documentsCount = 0;
}
