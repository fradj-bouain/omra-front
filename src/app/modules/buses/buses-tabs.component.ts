import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-buses-tabs',
  standalone: true,
  imports: [RouterOutlet, MatTabsModule, PageHeaderComponent, TranslatePipe],
  template: `
    <app-page-header
      [title]="'nav.buses' | translate"
      [subtitle]="'buses.tabs.subtitle' | translate"
      [actionLabel]="'buses.tabs.addBus' | translate"
      actionLink="/buses/new"
    ></app-page-header>

    <mat-tab-group [selectedIndex]="selectedIndex()" (selectedIndexChange)="onTab($event)">
      <mat-tab [label]="'buses.tabs.fleet' | translate"></mat-tab>
      <mat-tab [label]="'buses.tabs.transportOffers' | translate"></mat-tab>
      <mat-tab [label]="'buses.tabs.transportReservations' | translate"></mat-tab>
    </mat-tab-group>

    <section class="buses-tabs__content">
      <router-outlet></router-outlet>
    </section>
  `,
  styles: [
    `
      .buses-tabs__content {
        margin-top: 12px;
      }
    `,
  ],
})
export class BusesTabsComponent {
  private readonly router = inject(Router);

  selectedIndex(): number {
    const url = this.router.url || '';
    if (url.includes('/buses/my-reservations')) return 2;
    if (url.includes('/buses/offers')) return 1;
    return 0;
  }

  onTab(i: number): void {
    if (i === 0) void this.router.navigate(['/buses']);
    else if (i === 1) void this.router.navigate(['/buses/offers']);
    else void this.router.navigate(['/buses/my-reservations']);
  }
}
