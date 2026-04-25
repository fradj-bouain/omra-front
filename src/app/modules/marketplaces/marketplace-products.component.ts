import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-marketplace-products',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, PageHeaderComponent, TranslatePipe],
  templateUrl: './marketplace-products.component.html',
  styleUrl: './marketplace-products.component.scss',
})
export class MarketplaceProductsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  marketplaceId: number | null = null;

  ngOnInit(): void {
    const idRaw = this.route.snapshot.paramMap.get('id');
    if (!idRaw) return;
    const id = Number(idRaw);
    if (!isNaN(id)) this.marketplaceId = id;
  }
}

