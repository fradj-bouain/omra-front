import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-marketplace-orders',
  standalone: true,
  imports: [MatCardModule, MatIconModule, PageHeaderComponent, TranslatePipe],
  templateUrl: './marketplace-orders.component.html',
  styleUrl: './marketplace-orders.component.scss',
})
export class MarketplaceOrdersComponent {}

