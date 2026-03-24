import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatDrawerMode } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  opened = true;
  mode: MatDrawerMode = 'side';
  isMobile = false;
  currentYear = new Date().getFullYear();

  /** Menu for agency users (default). */
  menuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/pilgrims', icon: 'groups', label: 'Pèlerins' },
    { path: '/groups', icon: 'folder_special', label: 'Groupes Omra' },
    { path: '/flights', icon: 'flight', label: 'Vols' },
    { path: '/hotels', icon: 'hotel', label: 'Hôtels' },
    { path: '/documents', icon: 'description', label: 'Documents' },
    { path: '/payments', icon: 'payment', label: 'Paiements' },
    { path: '/task-templates', icon: 'account_tree', label: 'Types de tâches' },
    { path: '/plannings', icon: 'calendar_view_week', label: 'Plannings' },
    { path: '/buses', icon: 'directions_bus', label: 'Bus' },
    { path: '/notifications', icon: 'notifications', label: 'Notifications' },
    { path: '/users', icon: 'people', label: 'Utilisateurs' },
    { path: '/referral', icon: 'card_giftcard', label: 'Parrainage' },
  ];

  /** Menu for platform admin (super admin): agencies only. */
  adminMenuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/agencies', icon: 'business', label: 'Liste des agences' },
    { path: '/agencies/new', icon: 'add_business', label: 'Nouvelle agence' },
  ];

  /** Only use overlay (drawer over content) on very small screens; otherwise side-by-side so content is always visible. */
  private readonly overlayBreakpoint = '(max-width: 480px)';

  constructor(
    private breakpoint: BreakpointObserver,
    public auth: AuthService
  ) {
    this.breakpoint.observe([this.overlayBreakpoint]).subscribe((state: BreakpointState) => {
      this.isMobile = state.matches;
      this.mode = this.isMobile ? 'over' : 'side';
      this.opened = true; // keep sidebar open by default so content shows beside it
    });
  }

  toggleSidebar(): void {
    this.opened = !this.opened;
  }

  closeIfMobile(): void {
    if (this.isMobile) this.opened = false;
  }
}
