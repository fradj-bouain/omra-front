import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-hotels-tabs',
  standalone: true,
  imports: [RouterOutlet, MatTabsModule, PageHeaderComponent, TranslatePipe],
  template: `
    <app-page-header
      [title]="'nav.hotels' | translate"
      [subtitle]="'hotels.tabs.subtitle' | translate"
      [actionLabel]="'hotels.tabs.addHotel' | translate"
      actionLink="/hotels/new"
    ></app-page-header>

    <mat-tab-group [selectedIndex]="selectedIndex()" (selectedIndexChange)="onTab($event)">
      <mat-tab [label]="'hotels.tabs.hotels' | translate"></mat-tab>
      <mat-tab [label]="'hotels.tabs.offers' | translate"></mat-tab>
      <mat-tab [label]="'hotels.tabs.reservations' | translate"></mat-tab>
    </mat-tab-group>

    <section class="hotels-tabs__content">
      <router-outlet></router-outlet>
    </section>
  `,
  styles: [
    `
      .hotels-tabs__content {
        margin-top: 12px;
      }
    `,
  ],
})
export class HotelsTabsComponent {
  private readonly router = inject(Router);

  selectedIndex(): number {
    const url = this.router.url || '';
    if (url.includes('/hotels/my-reservations')) return 2;
    if (url.includes('/hotels/offers')) return 1;
    return 0;
  }

  onTab(i: number): void {
    if (i === 0) void this.router.navigate(['/hotels']);
    else if (i === 1) void this.router.navigate(['/hotels/offers']);
    else void this.router.navigate(['/hotels/my-reservations']);
  }
}

