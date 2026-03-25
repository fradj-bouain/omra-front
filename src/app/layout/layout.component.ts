import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatDrawerMode } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { resolveMediaUrl } from '../shared/utils/media-url';

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
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  readonly resolveMediaUrl = resolveMediaUrl;

  /** Mobile overlay: drawer visible or not. */
  opened = true;
  /** Desktop side mode: full width vs narrow icon rail. */
  sidebarExpanded = true;
  mode: MatDrawerMode = 'side';
  isMobile = false;
  currentYear = new Date().getFullYear();

  /** Menu for agency users (default). */
  menuItems = [
    { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard' },
    { path: '/pilgrims', icon: 'groups', labelKey: 'nav.pilgrims' },
    { path: '/groups', icon: 'folder_special', labelKey: 'nav.groups' },
    { path: '/flights', icon: 'flight', labelKey: 'nav.flights' },
    { path: '/hotels', icon: 'hotel', labelKey: 'nav.hotels' },
    { path: '/documents', icon: 'description', labelKey: 'nav.documents' },
    { path: '/payments', icon: 'payment', labelKey: 'nav.payments' },
    { path: '/task-templates', icon: 'account_tree', labelKey: 'nav.taskTemplates' },
    { path: '/plannings', icon: 'calendar_view_week', labelKey: 'nav.plannings' },
    { path: '/buses', icon: 'directions_bus', labelKey: 'nav.buses' },
    { path: '/notifications', icon: 'notifications', labelKey: 'nav.notifications' },
    { path: '/users', icon: 'people', labelKey: 'nav.users' },
    { path: '/referral', icon: 'card_giftcard', labelKey: 'nav.referral' },
  ];

  /** Menu for platform admin (super admin): agencies only. */
  adminMenuItems = [
    { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard' },
    { path: '/agencies', icon: 'business', labelKey: 'nav.agencies' },
    { path: '/agencies/new', icon: 'add_business', labelKey: 'nav.newAgency' },
  ];

  /** Only use overlay (drawer over content) on very small screens; otherwise side-by-side so content is always visible. */
  private readonly overlayBreakpoint = '(max-width: 480px)';

  constructor(
    private breakpoint: BreakpointObserver,
    public auth: AuthService,
    private theme: ThemeService
  ) {
    this.breakpoint.observe([this.overlayBreakpoint]).subscribe((state: BreakpointState) => {
      this.isMobile = state.matches;
      this.mode = this.isMobile ? 'over' : 'side';
      if (this.isMobile) {
        this.opened = false;
      } else {
        this.opened = true;
      }
    });
  }

  /** Drawer is always in the document flow on desktop; mobile uses overlay. */
  get sidenavOpened(): boolean {
    return this.isMobile ? this.opened : true;
  }

  onSidenavOpenedChange(next: boolean): void {
    if (this.isMobile) this.opened = next;
  }

  showNavLabels(): boolean {
    if (this.isMobile) return this.opened;
    return this.sidebarExpanded;
  }

  navToggleIcon(): string {
    if (this.isMobile) return this.opened ? 'close' : 'menu';
    return this.sidebarExpanded ? 'menu_open' : 'menu';
  }

  navToggleTooltipKey(): string {
    if (this.isMobile) return this.opened ? 'common.close' : 'layout.toggleMenu';
    return this.sidebarExpanded ? 'layout.collapseNav' : 'layout.expandNav';
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.opened = !this.opened;
    } else {
      this.sidebarExpanded = !this.sidebarExpanded;
    }
  }

  closeIfMobile(): void {
    if (this.isMobile) this.opened = false;
  }

  logout(): void {
    this.theme.resetToDefaults();
    this.auth.logout();
  }
}
