import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatDrawerMode } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { type AgencyKindUi } from '../core/guards/agency-kind.guard';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { resolveMediaUrl } from '../shared/utils/media-url';

export interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
  /** true pour la racine seule (ex. /dashboard). */
  linkExact?: boolean;
  /** Réservé aux administrateurs d’une agence principale (pas une sous-agence). */
  requireMainAgencyAdmin?: boolean;
  /** Si défini, l’entrée n’est visible que pour ces types d’agence (sinon : tous). */
  agencyKinds?: AgencyKindUi[];
}

export interface NavGroup {
  id: string;
  /** Titre de section ; absent = pas d’en-tête (ex. entrée tableau de bord en tête). */
  labelKey?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatExpansionModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  readonly resolveMediaUrl = resolveMediaUrl;
  private readonly router = inject(Router);

  /** État ouvert/fermé des sections (clé = id de groupe). Synchronisé avec la route pour la section active. */
  private readonly navPanelOpen = new Map<string, boolean>();

  /** Mobile overlay: drawer visible or not. */
  opened = true;
  /** Desktop side mode: full width vs narrow icon rail. */
  sidebarExpanded = true;
  mode: MatDrawerMode = 'side';
  isMobile = false;
  currentYear = new Date().getFullYear();

  /** Menu agence : sections + entrées (ordre métier). */
  readonly menuGroups: NavGroup[] = [
    {
      id: 'overview',
      items: [{ path: '/dashboard', icon: 'dashboard', labelKey: 'nav.dashboard', linkExact: true }],
    },
    {
      id: 'participants',
      labelKey: 'nav.group.participants',
      items: [
        { path: '/pilgrims', icon: 'groups', labelKey: 'nav.pilgrims', agencyKinds: ['TRAVEL'] },
        { path: '/groups', icon: 'folder_special', labelKey: 'nav.groups', agencyKinds: ['TRAVEL'] },
      ],
    },
    {
      id: 'travel',
      labelKey: 'nav.group.travelStay',
      items: [
        { path: '/flights', icon: 'flight', labelKey: 'nav.flights', agencyKinds: ['TRAVEL'] },
        { path: '/hotels', icon: 'hotel', labelKey: 'nav.hotels', agencyKinds: ['TRAVEL'] },
        { path: '/buses', icon: 'directions_bus', labelKey: 'nav.buses', agencyKinds: ['TRAVEL'] },
        { path: '/plannings', icon: 'calendar_view_week', labelKey: 'nav.plannings', agencyKinds: ['TRAVEL'] },
      ],
    },
    {
      id: 'administrative',
      labelKey: 'nav.group.administrative',
      items: [
        { path: '/documents', icon: 'description', labelKey: 'nav.documents', agencyKinds: ['TRAVEL'] },
        { path: '/payments', icon: 'payment', labelKey: 'nav.payments', agencyKinds: ['TRAVEL'] },
      ],
    },
    {
      id: 'shop',
      labelKey: 'nav.group.shop',
      items: [
        { path: '/shop/articles', icon: 'inventory_2', labelKey: 'nav.shop.articles', agencyKinds: ['MARKETPLACE'] },
        { path: '/shop/orders', icon: 'shopping_bag', labelKey: 'nav.shop.orders', agencyKinds: ['MARKETPLACE'] },
        { path: '/shop/stock', icon: 'warehouse', labelKey: 'nav.shop.stock', agencyKinds: ['MARKETPLACE'] },
        { path: '/shop/settings', icon: 'tune', labelKey: 'nav.shop.settings', agencyKinds: ['MARKETPLACE'] },
      ],
    },
    {
      id: 'hotelOp',
      labelKey: 'nav.group.hotel',
      items: [
        {
          path: '/hotel-operator/properties',
          icon: 'apartment',
          labelKey: 'nav.hotel.properties',
          agencyKinds: ['HOTEL'],
        },
        {
          path: '/hotel-operator/offers',
          icon: 'local_offer',
          labelKey: 'nav.hotel.offers',
          agencyKinds: ['HOTEL'],
        },
      ],
    },
    {
      id: 'agency',
      labelKey: 'nav.group.agency',
      items: [
        {
          path: '/agency/subs',
          icon: 'hub',
          labelKey: 'nav.subAgencies',
          requireMainAgencyAdmin: true,
          agencyKinds: ['TRAVEL'],
        },
        { path: '/users', icon: 'people', labelKey: 'nav.users' },
        { path: '/task-templates', icon: 'account_tree', labelKey: 'nav.taskTemplates', agencyKinds: ['TRAVEL'] },
        { path: '/referral', icon: 'card_giftcard', labelKey: 'nav.referral', agencyKinds: ['TRAVEL'] },
      ],
    },
  ];

  /**
   * Responsive rule: on small screens, the drawer must overlay the content (not push it),
   * otherwise the main cards become cramped / shifted sideways.
   */
  private readonly overlayBreakpoint = '(max-width: 1024px)';

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

    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.syncNavPanelForActiveRoute();
    });
    this.syncNavPanelForActiveRoute();
  }

  /** Ouvre la section qui contient la page courante (après navigation). */
  private syncNavPanelForActiveRoute(): void {
    const gid = this.findActiveLabeledGroupId();
    if (gid) this.navPanelOpen.set(gid, true);
  }

  private currentUrlPath(): string {
    return this.router.url.split('?')[0];
  }

  private findActiveLabeledGroupId(): string | null {
    const path = this.currentUrlPath();
    for (const g of this.menuGroups) {
      if (!g.labelKey) continue;
      if (this.groupContainsPath(g, path)) return g.id;
    }
    return null;
  }

  visibleNavItems(group: NavGroup): NavItem[] {
    return group.items.filter((item) => this.navItemVisible(item));
  }

  navItemVisible(item: NavItem): boolean {
    if (item.requireMainAgencyAdmin) {
      const u = this.auth.user();
      const a = this.auth.agency();
      if (!(u?.role === 'AGENCY_ADMIN' && a != null && a.parentAgencyId == null)) {
        return false;
      }
    }
    if (item.agencyKinds?.length) {
      const kind = this.effectiveAgencyKind();
      if (!item.agencyKinds.includes(kind)) {
        return false;
      }
    }
    return true;
  }

  private effectiveAgencyKind(): AgencyKindUi {
    const k = this.auth.agency()?.agencyKind;
    if (k === 'MARKETPLACE' || k === 'HOTEL') {
      return k;
    }
    return 'TRAVEL';
  }

  navGroupVisible(group: NavGroup): boolean {
    return this.visibleNavItems(group).length > 0;
  }

  groupContainsPath(group: NavGroup, path: string): boolean {
    return this.visibleNavItems(group).some(
      (item) => path === item.path || (item.path !== '/' && path.startsWith(item.path + '/')),
    );
  }

  isNavPanelExpanded(group: NavGroup): boolean {
    if (!group.labelKey) return true;
    if (this.navPanelOpen.has(group.id)) {
      return this.navPanelOpen.get(group.id)!;
    }
    return this.groupContainsPath(group, this.currentUrlPath());
  }

  onNavPanelExpandedChange(group: NavGroup, expanded: boolean): void {
    if (!group.labelKey) return;
    this.navPanelOpen.set(group.id, expanded);
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
