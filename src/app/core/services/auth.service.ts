import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: number;
  agencyId: number | null;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  telephone?: string;
  cin?: string;
  active?: boolean;
}

export interface Agency {
  id: number;
  name: string;
  email: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sidebarColor?: string;
  menuColor?: string;
  buttonColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  textColor?: string;
  themeMode?: 'LIGHT' | 'DARK';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  agency?: Agency | null;
  admin?: Admin;
}

const TOKEN_KEY = 'omra_access_token';
const REFRESH_KEY = 'omra_refresh_token';
const USER_KEY = 'omra_user';
const AGENCY_KEY = 'omra_agency';
const ADMIN_KEY = 'omra_admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.getStoredUser());
  private readonly currentAgency = signal<Agency | null>(this.getStoredAgency());
  private readonly currentAdmin = signal<Admin | null>(this.getStoredAdmin());

  user = this.currentUser.asReadonly();
  agency = this.currentAgency.asReadonly();
  admin = this.currentAdmin.asReadonly();
  isLoggedIn = computed(() => !!this.getToken());
  isAdmin = computed(() => !!this.currentAdmin());

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private router: Router
  ) {}

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  /** Super admin: email containing "superadmin" (e.g. superadmin@omra.local) uses admin login. */
  private isSuperAdminEmail(email: string): boolean {
    return email.toLowerCase().includes('superadmin');
  }

  login(email: string, password: string): Observable<AuthResponse> {
    if (this.isSuperAdminEmail(email)) {
      return this.http.post<AuthResponse>(this.api.adminAuth.login, { email, password }).pipe(
        tap((res) => this.applyAuthResponse(res, true))
      );
    }
    return this.http.post<AuthResponse>(this.api.auth.login, { email, password }).pipe(
      tap((res) => this.applyAuthResponse(res, false))
    );
  }

  private applyAuthResponse(res: AuthResponse, asAdmin: boolean): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    if (asAdmin && res.admin) {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin));
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(AGENCY_KEY);
      this.currentUser.set(null);
      this.currentAgency.set(null);
      this.currentAdmin.set(res.admin);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user ?? null));
      localStorage.setItem(AGENCY_KEY, JSON.stringify(res.agency ?? null));
      localStorage.removeItem(ADMIN_KEY);
      this.currentUser.set(res.user ?? null);
      this.currentAgency.set(res.agency ?? null);
      this.currentAdmin.set(null);
    }
  }

  logout() {
    const refresh = this.getRefreshToken();
    if (refresh) {
      const url = this.currentAdmin() ? this.api.adminAuth.logout : this.api.auth.logout;
      this.http.post(url, { refresh_token: refresh }).subscribe();
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AGENCY_KEY);
    localStorage.removeItem(ADMIN_KEY);
    this.currentUser.set(null);
    this.currentAgency.set(null);
    this.currentAdmin.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return of(null);
    const isAdmin = !!this.getStoredAdmin();
    const url = isAdmin ? this.api.adminAuth.refresh : this.api.auth.refresh;
    return this.http.post<AuthResponse>(url, { refresh_token: refresh }).pipe(
      tap((res) => {
        const asAdmin = !!res.admin;
        this.applyAuthResponse(res, asAdmin);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private getStoredAgency(): Agency | null {
    const raw = localStorage.getItem(AGENCY_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private getStoredAdmin(): Admin | null {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
