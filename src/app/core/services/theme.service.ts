import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { AuthService, type Agency } from './auth.service';

export interface AgencyTheme {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  menuColor?: string;
  buttonColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService
  ) {}

  loadTheme(): void {
    if (!this.auth.getToken()) return;
    this.http.get<AgencyTheme>(this.api.agencies.theme).subscribe({
      next: (theme) => this.applyTheme(theme),
      error: () => this.applyTheme(this.auth.agency() ?? {}),
    });
  }

  applyTheme(theme: AgencyTheme | Agency | null): void {
    if (!theme) return;
    const doc = document.documentElement.style;
    const t = theme as Record<string, string | undefined>;
    if (t['primaryColor']) doc.setProperty('--primary-color', t['primaryColor']);
    if (t['secondaryColor']) doc.setProperty('--secondary-color', t['secondaryColor']);
    if (t['menuColor']) doc.setProperty('--menu-color', t['menuColor']);
    if (t['buttonColor']) doc.setProperty('--button-color', t['buttonColor']);
    if (t['backgroundColor']) doc.setProperty('--background-color', t['backgroundColor']);
    if (t['textColor']) doc.setProperty('--text-color', t['textColor']);
  }
}
