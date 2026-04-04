import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { resolveMediaUrl } from '../../shared/utils/media-url';
import { ApiService } from './api.service';
import { AuthService, type Agency } from './auth.service';

export type ThemeMode = 'LIGHT' | 'DARK';

export interface AgencyTheme {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  sidebarColor?: string | null;
  menuColor?: string | null;
  buttonColor?: string | null;
  backgroundColor?: string | null;
  cardColor?: string | null;
  textColor?: string | null;
  themeMode?: ThemeMode | null;
}

/** Blue SaaS — default palette (backend + frontend). */
export const BLUE_SAAS_THEME: AgencyTheme = {
  primaryColor: '#2563EB',
  secondaryColor: '#1E293B',
  sidebarColor: '#0F172A',
  backgroundColor: '#F8FAFC',
  cardColor: '#FFFFFF',
  textColor: '#111827',
  buttonColor: '#2563EB',
  menuColor: '#0F172A',
  themeMode: 'LIGHT',
};

/** Built-in presets (agencies can pick one or customize manually). */
export const THEME_PRESETS: Record<string, AgencyTheme> = {
  blueSaas: {
    primaryColor: '#2563EB',
    secondaryColor: '#1E293B',
    sidebarColor: '#0F172A',
    backgroundColor: '#F8FAFC',
    cardColor: '#FFFFFF',
    textColor: '#111827',
    buttonColor: '#2563EB',
    menuColor: '#0F172A',
    themeMode: 'LIGHT',
  },
  greenIslamic: {
    primaryColor: '#16A34A',
    secondaryColor: '#14532D',
    sidebarColor: '#052E16',
    backgroundColor: '#F0FDF4',
    cardColor: '#FFFFFF',
    textColor: '#064E3B',
    buttonColor: '#16A34A',
    menuColor: '#052E16',
    themeMode: 'LIGHT',
  },
  purpleModern: {
    primaryColor: '#7C3AED',
    secondaryColor: '#2E1065',
    sidebarColor: '#1E1B4B',
    backgroundColor: '#F5F3FF',
    cardColor: '#FFFFFF',
    textColor: '#1F2937',
    buttonColor: '#7C3AED',
    menuColor: '#1E1B4B',
    themeMode: 'LIGHT',
  },
  redBold: {
    primaryColor: '#DC2626',
    secondaryColor: '#7F1D1D',
    sidebarColor: '#450A0A',
    backgroundColor: '#FEF2F2',
    cardColor: '#FFFFFF',
    textColor: '#111827',
    buttonColor: '#DC2626',
    menuColor: '#450A0A',
    themeMode: 'LIGHT',
  },
  darkPro: {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E293B',
    sidebarColor: '#020617',
    backgroundColor: '#020617',
    cardColor: '#0F172A',
    textColor: '#E2E8F0',
    buttonColor: '#3B82F6',
    menuColor: '#020617',
    themeMode: 'DARK',
  },
  orangeFriendly: {
    primaryColor: '#F97316',
    secondaryColor: '#7C2D12',
    sidebarColor: '#431407',
    backgroundColor: '#FFF7ED',
    cardColor: '#FFFFFF',
    textColor: '#1F2937',
    buttonColor: '#F97316',
    menuColor: '#431407',
    themeMode: 'LIGHT',
  },
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private lastTheme: AgencyTheme | null = null;

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService
  ) {}

  getStoredTheme(): AgencyTheme | null {
    return this.lastTheme;
  }

  /** Load from API when authenticated with an agency; otherwise apply Blue SaaS. */
  loadTheme(): void {
    this.loadTheme$().subscribe();
  }

  /** Same as {@link loadTheme} but completes after colors are applied (e.g. before post-login navigation). */
  loadTheme$(): Observable<void> {
    const token = this.auth.getToken();
    const agency = this.auth.agency();
    if (!token || !agency?.id) {
      this.applyTheme(null);
      return of(undefined);
    }
    return this.http.get<AgencyTheme | null>(this.api.agencies.theme).pipe(
      timeout(8000),
      tap((theme) => {
        if (theme && typeof theme === 'object') {
          this.applyTheme(theme);
        } else {
          this.applyTheme(this.fallbackFromStoredAgency(agency));
        }
      }),
      catchError(() => {
        this.applyTheme(this.fallbackFromStoredAgency(agency));
        return of(null);
      }),
      map(() => undefined)
    );
  }

  private fallbackFromStoredAgency(agency: Agency): AgencyTheme {
    return {
      logoUrl: agency.logoUrl,
      primaryColor: agency.primaryColor,
      secondaryColor: agency.secondaryColor,
      sidebarColor: agency.sidebarColor ?? agency.menuColor,
      menuColor: agency.menuColor,
      buttonColor: agency.buttonColor,
      backgroundColor: agency.backgroundColor,
      cardColor: agency.cardColor,
      textColor: agency.textColor,
      themeMode: agency.themeMode ?? 'LIGHT',
    };
  }

  /**
   * Merge with Blue SaaS defaults, set CSS variables + design tokens, optional smooth transition.
   */
  applyTheme(partial: AgencyTheme | Agency | null | undefined, options?: { transition?: boolean }): void {
    const base = BLUE_SAAS_THEME;
    const p = partial as Record<string, string | null | undefined> | null;
    const pick = (key: string): string => {
      const v = p?.[key];
      return v != null && String(v).trim() !== '' ? String(v).trim() : (base as Record<string, string>)[key];
    };

    const primary = pick('primaryColor');
    const secondary = pick('secondaryColor');
    const sidebar = pick('sidebarColor') || pick('menuColor');
    const menu = p?.['menuColor'] != null && String(p['menuColor']).trim() !== '' ? String(p['menuColor']).trim() : sidebar;
    const button = pick('buttonColor');
    const background = pick('backgroundColor');
    const card = pick('cardColor');
    const text = pick('textColor');
    const rawMode = p?.['themeMode'];
    const themeMode: ThemeMode =
      rawMode === 'DARK' || rawMode === 'LIGHT' ? rawMode : base.themeMode ?? 'LIGHT';

    const merged: AgencyTheme = {
      logoUrl: p?.['logoUrl'] ?? undefined,
      faviconUrl: p?.['faviconUrl'] ?? undefined,
      primaryColor: primary,
      secondaryColor: secondary,
      sidebarColor: sidebar,
      menuColor: menu,
      buttonColor: button,
      backgroundColor: background,
      cardColor: card,
      textColor: text,
      themeMode,
    };
    this.lastTheme = merged;

    const root = document.documentElement;
    const useTransition = options?.transition !== false;
    if (useTransition) {
      root.classList.add('theme-transition');
    }

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--sidebar-color', sidebar);
    root.style.setProperty('--menu-color', menu);
    root.style.setProperty('--button-color', button);
    root.style.setProperty('--background-color', background);
    root.style.setProperty('--card-color', card);
    root.style.setProperty('--text-color', text);

    root.style.setProperty('--app-accent', primary);
    root.style.setProperty('--app-accent-hover', secondary);
    root.style.setProperty('--app-accent-soft', this.softMix(primary, 0.18));
    root.style.setProperty('--app-accent-ring', this.hexToRgba(primary, 0.35));
    root.style.setProperty('--app-bg', background);
    root.style.setProperty('--app-card', card);
    root.style.setProperty('--app-text', text);
    root.style.setProperty('--app-border', `color-mix(in srgb, ${text} 14%, ${background} 86%)`);
    root.style.setProperty('--header-bg', `color-mix(in srgb, ${background} 88%, ${sidebar} 12%)`);
    root.style.setProperty('--chart-1', primary);
    root.style.setProperty('--chart-2', `color-mix(in srgb, ${primary} 55%, #06b6d4 45%)`);
    root.style.setProperty('--chart-3', secondary);
    root.style.setProperty('--chart-4', menu);
    root.style.setProperty('--chart-5', button);
    root.style.setProperty('--chart-6', this.softMix(primary, 0.35));

    root.setAttribute('data-theme', themeMode === 'DARK' ? 'dark' : 'light');

    this.patchFavicon(merged.faviconUrl);

    if (useTransition) {
      requestAnimationFrame(() => {
        setTimeout(() => root.classList.remove('theme-transition'), 380);
      });
    }
  }

  resetToDefaults(): void {
    this.lastTheme = null;
    this.applyTheme(null, { transition: true });
  }

  private patchFavicon(url: string | null | undefined): void {
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = resolveMediaUrl(url);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    if (h.length !== 6) return `rgba(37, 99, 235, ${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /** Light wash of hex for soft backgrounds. */
  private softMix(hex: string, amount: number): string {
    return `color-mix(in srgb, ${hex} ${Math.round(amount * 100)}%, white)`;
  }

}
