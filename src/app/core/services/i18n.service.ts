import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export type UiLang = 'fr' | 'ar';

const STORAGE_KEY = 'omra_lang';

/** Textes de secours si l’API des traductions est indisponible (FR uniquement). */
const FALLBACK_FR: Record<string, string> = {
  'login.title': 'Connexion',
  'login.submit': 'Se connecter',
  'nav.dashboard': 'Dashboard',
  'layout.settings': 'Paramètres',
  'layout.logout': 'Déconnexion',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.loading': 'Chargement…',
  'settings.title': 'Paramètres',
  'settings.language': 'Langue de l’interface',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);

  private readonly dict = signal<Record<string, string>>({});
  readonly loaded = signal(false);
  readonly currentLang = signal<UiLang>('fr');

  /** Pour alignement futur (dates, nombres). */
  readonly angularLocaleId = computed(() => (this.currentLang() === 'ar' ? 'ar' : 'fr-FR'));

  async initialize(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY) as UiLang | null;
    const lang: UiLang = stored === 'ar' ? 'ar' : 'fr';
    this.currentLang.set(lang);
    await this.loadLocale(lang, true);
  }

  async loadLocale(lang: UiLang, isInitial = false): Promise<void> {
    try {
      const map = await firstValueFrom(
        this.http.get<Record<string, string>>(this.api.i18n.translations(lang))
      );
      this.dict.set(map && typeof map === 'object' ? map : {});
    } catch {
      this.dict.set(isInitial && lang === 'fr' ? { ...FALLBACK_FR } : {});
    }
    this.applyDocumentLang(lang);
    this.loaded.set(true);
  }

  setLanguage(lang: UiLang): void {
    localStorage.setItem(STORAGE_KEY, lang);
    this.currentLang.set(lang);
    void this.loadLocale(lang, false);
  }

  instant(key: string, params?: Record<string, string | number>): string {
    let s = this.dict()[key];
    if (s == null || s === '') {
      s = key;
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.split(`{{${k}}}`).join(String(v));
      }
    }
    return s;
  }

  private applyDocumentLang(lang: UiLang): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'fr';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
