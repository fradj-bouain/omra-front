import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { I18nService } from '../../core/services/i18n.service';
import { ShopProduct, ShopProductWritePayload } from './models/shop.models';

@Component({
  selector: 'app-shop-articles',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './shop-articles.component.html',
  styleUrl: './shop-articles.component.scss',
})
export class ShopArticlesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly notif = inject(NotificationService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);

  mode: 'articles' | 'stock' = 'articles';
  loading = false;
  dataSource: ShopProduct[] = [];
  /** Stock mode: draft values per product id */
  draftStock = new Map<number, { inStock: boolean; stockQuantity: number | null }>();

  displayedColumnsArticles = ['title', 'price', 'currency', 'actions'];
  displayedColumnsStock = ['title', 'inStock', 'stockQty', 'save'];

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['shopMode'] as 'articles' | 'stock') || 'articles';
    this.load();
  }

  load(): void {
    this.loading = true;
    this.http.get<ShopProduct[]>(this.api.shop.products).subscribe({
      next: (rows) => {
        this.dataSource = Array.isArray(rows) ? rows : [];
        this.draftStock.clear();
        for (const p of this.dataSource) {
          this.draftStock.set(p.id, {
            inStock: p.inStock,
            stockQuantity: p.stockQuantity ?? null,
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notif.error(err.error?.message || this.i18n.instant('marketplace.loadError'));
      },
    });
  }

  get displayedColumns(): string[] {
    return this.mode === 'stock' ? this.displayedColumnsStock : this.displayedColumnsArticles;
  }

  deleteRow(row: ShopProduct): void {
    if (!confirm(this.i18n.instant('shop.deleteProductConfirm'))) return;
    this.http.delete(this.api.shop.productById(row.id)).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.deleteSuccess'));
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('marketplace.deleteError')),
    });
  }

  saveStockRow(row: ShopProduct): void {
    const d = this.draftStock.get(row.id);
    if (!d) return;
    const body: ShopProductWritePayload = {
      title: row.title,
      description: row.description ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      price: row.price,
      currency: row.currency,
      inStock: d.inStock,
      stockQuantity: d.stockQuantity,
    };
    this.http.put<ShopProduct>(this.api.shop.productById(row.id), body).subscribe({
      next: () => {
        this.notif.success(this.i18n.instant('marketplace.form.saveSuccessEdit'));
        this.load();
      },
      error: (err) => this.notif.error(err.error?.message || this.i18n.instant('marketplace.form.saveError')),
    });
  }

  draftInStock(id: number): boolean {
    return this.draftStock.get(id)?.inStock ?? false;
  }

  setDraftInStock(id: number, v: boolean): void {
    const cur = this.draftStock.get(id);
    if (cur) cur.inStock = v;
  }

  draftQty(id: number): number | null {
    return this.draftStock.get(id)?.stockQuantity ?? null;
  }

  setDraftQty(id: number, v: number | null): void {
    const cur = this.draftStock.get(id);
    if (cur) cur.stockQuantity = v;
  }
}
