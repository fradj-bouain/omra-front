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
}

const TOKEN_KEY = 'omra_access_token';
const REFRESH_KEY = 'omra_refresh_token';
const USER_KEY = 'omra_user';
const AGENCY_KEY = 'omra_agency';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.getStoredUser());
  private readonly currentAgency = signal<Agency | null>(this.getStoredAgency());
  /** Invalide `isLoggedIn` après login / logout (le token est dans localStorage, pas un signal). */
  private readonly sessionTick = signal(0);

  user = this.currentUser.asReadonly();
  agency = this.currentAgency.asReadonly();
  isLoggedIn = computed(() => {
    this.sessionTick();
    return !!localStorage.getItem(TOKEN_KEY);
  });

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

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.api.auth.login, { email, password }).pipe(tap((res) => this.applyAuthResponse(res)));
  }

  private applyAuthResponse(res: AuthResponse): void {
    localStorage.removeItem('omra_admin');
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user ?? null));
    localStorage.setItem(AGENCY_KEY, JSON.stringify(res.agency ?? null));
    this.currentUser.set(res.user ?? null);
    this.currentAgency.set(res.agency ?? null);
    this.sessionTick.update((n) => n + 1);
  }

  logout() {
    const refresh = this.getRefreshToken();
    if (refresh) {
      this.http.post(this.api.auth.logout, { refresh_token: refresh }).subscribe();
    }
    this.clearLocalSession();
    void this.router.navigate(['/login']);
  }

  /**
   * Abonnement expiré / agence suspendue : coupe la session sans appeler l’API logout
   * (le filtre peut encore refuser), puis redirige vers la connexion avec un message.
   */
  sessionTerminatedByServer(message: string, code: string): void {
    this.clearLocalSession();
    sessionStorage.setItem(
      'omra_auth_notice',
      JSON.stringify({ message: message || '', code: code || 'SUBSCRIPTION_INACTIVE' }),
    );
    const reason = code === 'AGENCY_SUSPENDED' ? 'agency' : 'subscription';
    void this.router.navigate(['/login'], { queryParams: { reason }, replaceUrl: true });
  }

  private clearLocalSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AGENCY_KEY);
    this.currentUser.set(null);
    this.currentAgency.set(null);
    this.sessionTick.update((n) => n + 1);
  }

  refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return of(null);
    return this.http.post<AuthResponse>(this.api.auth.refresh, { refresh_token: refresh }).pipe(
      tap((res) => this.applyAuthResponse(res)),
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
}
