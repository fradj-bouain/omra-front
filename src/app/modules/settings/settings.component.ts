import { Component, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ApiService } from '../../core/services/api.service';
import {
  BLUE_SAAS_THEME,
  THEME_PRESETS,
  ThemeService,
  type AgencyTheme,
} from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { I18nService, type UiLang } from '../../core/services/i18n.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { resolveMediaUrl } from '../../shared/utils/media-url';
import { fileUrlFromUploadResponse } from '../../shared/utils/upload-response';
import { forkJoin } from 'rxjs';

export interface AgencySubscriptionRow {
  id: number;
  agencyId: number;
  planId: number;
  planCode: string | null;
  planName: string | null;
  periodStart: string;
  periodEnd: string;
  status: string;
  paidAt: string | null;
  paymentReference: string | null;
  amountPaid: number | string | null;
  currency: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgencySubscriptionSummary {
  latest: AgencySubscriptionRow | null;
  currentValid: AgencySubscriptionRow | null;
}

export interface SubscriptionPageResponse {
  content: AgencySubscriptionRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

type BrandingForm = {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  sidebarColor: string;
  menuColor: string;
  buttonColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  themeMode: 'LIGHT' | 'DARK';
};

type ColorFieldKey = Exclude<
  keyof BrandingForm,
  'logoUrl' | 'faviconUrl' | 'themeMode'
>;

const PRESET_ORDER = [
  'blueSaas',
  'greenIslamic',
  'purpleModern',
  'redBold',
  'darkPro',
  'orangeFriendly',
] as const;

const PRESET_LABEL_KEYS: Record<(typeof PRESET_ORDER)[number], string> = {
  blueSaas: 'settings.palette.blueSaas',
  greenIslamic: 'settings.palette.greenIslamic',
  purpleModern: 'settings.palette.purpleModern',
  redBold: 'settings.palette.redBold',
  darkPro: 'settings.palette.darkPro',
  orangeFriendly: 'settings.palette.orangeFriendly',
};

function stripFromPreset(p: AgencyTheme | undefined): string[] {
  if (!p) return ['#ccc', '#999', '#eee'];
  const a = p.primaryColor ?? '#888';
  const b = p.sidebarColor ?? p.menuColor ?? '#666';
  const c = p.backgroundColor ?? '#f5f5f5';
  return [a, b, c];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    UpperCasePipe,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatButtonToggleModule,
    TranslatePipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  readonly resolveMediaUrl = resolveMediaUrl;

  readonly presetCards = PRESET_ORDER.map((id) => ({
    id,
    labelKey: PRESET_LABEL_KEYS[id],
    strip: stripFromPreset(THEME_PRESETS[id]),
  }));

  readonly colorFieldRows: { key: ColorFieldKey; labelKey: string; placeholder: string }[] = [
    { key: 'primaryColor', labelKey: 'settings.primaryColor', placeholder: '#2563EB' },
    { key: 'secondaryColor', labelKey: 'settings.secondaryColor', placeholder: '#1E293B' },
    { key: 'sidebarColor', labelKey: 'settings.sidebarColor', placeholder: '#0F172A' },
    { key: 'menuColor', labelKey: 'settings.menuColor', placeholder: '#0F172A' },
    { key: 'buttonColor', labelKey: 'settings.buttonColor', placeholder: '#2563EB' },
    { key: 'backgroundColor', labelKey: 'settings.backgroundColor', placeholder: '#F8FAFC' },
    { key: 'cardColor', labelKey: 'settings.cardColor', placeholder: '#FFFFFF' },
    { key: 'textColor', labelKey: 'settings.textColor', placeholder: '#111827' },
  ];

  uploadingLogo = false;
  uploadingFavicon = false;

  subscriptionSummary: AgencySubscriptionSummary | null = null;
  subscriptionPage: SubscriptionPageResponse | null = null;
  subscriptionLoading = false;
  subscriptionLoadFailed = false;
  selectedSubscription: AgencySubscriptionRow | null = null;
  subPageIndex = 0;
  readonly subPageSize = 12;

  selectedPreset = '';

  branding: BrandingForm = this.defaultBranding();

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private theme: ThemeService,
    public auth: AuthService,
    private notif: NotificationService,
    readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    const ag = this.auth.agency();
    if (!ag) return;
    this.http.get<AgencyTheme | null>(this.api.agencies.theme).subscribe({
      next: (t) => {
        if (!t) return;
        this.branding = this.mergeServerTheme(t);
        this.selectedPreset = this.detectPreset(this.branding);
      },
    });
    this.loadSubscriptionData();
  }

  loadSubscriptionData(): void {
    if (!this.auth.agency()) return;
    this.subscriptionLoading = true;
    this.subscriptionLoadFailed = false;
    forkJoin({
      summary: this.http.get<AgencySubscriptionSummary>(this.api.meSubscriptions.summary),
      page: this.http.get<SubscriptionPageResponse>(
        this.api.meSubscriptions.listPage(this.subPageIndex, this.subPageSize),
      ),
    }).subscribe({
      next: ({ summary, page }) => {
        this.subscriptionSummary = summary;
        this.subscriptionPage = page;
        this.subscriptionLoading = false;
        this.subscriptionLoadFailed = false;
        this.selectedSubscription = null;
      },
      error: () => {
        this.subscriptionLoading = false;
        this.subscriptionLoadFailed = true;
        this.notif.error(this.i18n.instant('settings.subscription.loadError'));
      },
    });
  }

  changeSubPage(delta: number): void {
    const next = this.subPageIndex + delta;
    if (next < 0) return;
    const total = this.subscriptionPage?.totalPages ?? 0;
    if (total > 0 && next >= total) return;
    this.subPageIndex = next;
    this.loadSubscriptionData();
  }

  selectSubscriptionRow(row: AgencySubscriptionRow): void {
    this.selectedSubscription = row;
  }

  subscriptionStatusLabel(status: string): string {
    const key = `settings.subscription.status.${status}`;
    const t = this.i18n.instant(key);
    return t === key ? status : t;
  }

  formatSubscriptionAmount(row: AgencySubscriptionRow): string {
    if (row.amountPaid == null || row.amountPaid === '') return '—';
    const n = typeof row.amountPaid === 'number' ? row.amountPaid : Number(row.amountPaid);
    if (Number.isNaN(n)) return String(row.amountPaid);
    return (
      new Intl.NumberFormat(this.i18n.angularLocaleId(), { maximumFractionDigits: 2 }).format(n) +
      (row.currency ? ` ${row.currency}` : '')
    );
  }

  hexForPicker(hex: string | undefined): string {
    const raw = (hex ?? '').trim();
    let h = raw.startsWith('#') ? raw : '#' + raw;
    if (/^#[0-9A-Fa-f]{6}$/.test(h)) {
      return h;
    }
    return '#2563eb';
  }

  onColorPicker(key: ColorFieldKey, ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    if (/^#[0-9A-Fa-f]{6}$/i.test(v)) {
      this.branding[key] = v.toUpperCase();
      this.onManualColor();
    }
  }

  private defaultBranding(): BrandingForm {
    const b = BLUE_SAAS_THEME;
    return {
      logoUrl: '',
      faviconUrl: '',
      primaryColor: b.primaryColor ?? '#2563EB',
      secondaryColor: b.secondaryColor ?? '#1E293B',
      sidebarColor: b.sidebarColor ?? '#0F172A',
      menuColor: b.menuColor ?? '#0F172A',
      buttonColor: b.buttonColor ?? '#2563EB',
      backgroundColor: b.backgroundColor ?? '#F8FAFC',
      cardColor: b.cardColor ?? '#FFFFFF',
      textColor: b.textColor ?? '#111827',
      themeMode: b.themeMode === 'DARK' ? 'DARK' : 'LIGHT',
    };
  }

  private mergeServerTheme(t: AgencyTheme): BrandingForm {
    const d = this.defaultBranding();
    if (t.logoUrl != null && t.logoUrl !== '') d.logoUrl = t.logoUrl;
    if (t.faviconUrl != null && t.faviconUrl !== '') d.faviconUrl = t.faviconUrl;
    if (t.primaryColor) d.primaryColor = t.primaryColor;
    if (t.secondaryColor) d.secondaryColor = t.secondaryColor;
    if (t.sidebarColor) d.sidebarColor = t.sidebarColor;
    if (t.menuColor) d.menuColor = t.menuColor;
    if (t.buttonColor) d.buttonColor = t.buttonColor;
    if (t.backgroundColor) d.backgroundColor = t.backgroundColor;
    if (t.cardColor) d.cardColor = t.cardColor;
    if (t.textColor) d.textColor = t.textColor;
    if (t.themeMode === 'LIGHT' || t.themeMode === 'DARK') d.themeMode = t.themeMode;
    return d;
  }

  private detectPreset(b: BrandingForm): string {
    for (const key of Object.keys(THEME_PRESETS)) {
      const p = THEME_PRESETS[key]!;
      const same =
        eq(b.primaryColor, p.primaryColor) &&
        eq(b.secondaryColor, p.secondaryColor) &&
        eq(b.sidebarColor, p.sidebarColor) &&
        eq(b.backgroundColor, p.backgroundColor) &&
        eq(b.cardColor, p.cardColor) &&
        eq(b.textColor, p.textColor) &&
        eq(b.buttonColor, p.buttonColor) &&
        eq(b.menuColor, p.menuColor) &&
        b.themeMode === (p.themeMode ?? 'LIGHT');
      if (same) return key;
    }
    return '';
  }

  onLangChange(ev: MatSelectChange): void {
    const l = ev.value === 'ar' ? 'ar' : 'fr';
    this.i18n.setLanguage(l as UiLang);
  }

  applyPresetId(id: string): void {
    this.selectedPreset = id;
    if (!id) return;
    const preset = THEME_PRESETS[id];
    if (!preset) return;
    const p = preset;
    this.branding.primaryColor = p.primaryColor ?? this.branding.primaryColor;
    this.branding.secondaryColor = p.secondaryColor ?? this.branding.secondaryColor;
    this.branding.sidebarColor = p.sidebarColor ?? this.branding.sidebarColor;
    this.branding.menuColor = p.menuColor ?? p.sidebarColor ?? this.branding.menuColor;
    this.branding.buttonColor = p.buttonColor ?? this.branding.buttonColor;
    this.branding.backgroundColor = p.backgroundColor ?? this.branding.backgroundColor;
    this.branding.cardColor = p.cardColor ?? this.branding.cardColor;
    this.branding.textColor = p.textColor ?? this.branding.textColor;
    this.branding.themeMode = (p.themeMode as 'LIGHT' | 'DARK') ?? this.branding.themeMode;
  }

  onManualColor(): void {
    this.selectedPreset = '';
  }

  onBrandingFileSelected(event: Event, kind: 'logo' | 'favicon', input: HTMLInputElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    input.value = '';
    if (!file) return;
    const uploadType = kind === 'logo' ? 'branding-logo' : 'branding-favicon';
    if (kind === 'logo') this.uploadingLogo = true;
    else this.uploadingFavicon = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);
    this.http.post<unknown>(this.api.files.upload, formData).subscribe({
      next: (res) => {
        if (kind === 'logo') this.uploadingLogo = false;
        else this.uploadingFavicon = false;
        const u = fileUrlFromUploadResponse(res);
        if (u) {
          if (kind === 'logo') this.branding.logoUrl = u;
          else this.branding.faviconUrl = u;
          this.notif.success(this.i18n.instant('settings.fileUploaded'));
        } else {
          this.notif.error(this.i18n.instant('settings.fileUploadBadResponse'));
        }
      },
      error: () => {
        if (kind === 'logo') this.uploadingLogo = false;
        else this.uploadingFavicon = false;
        this.notif.error(this.i18n.instant('settings.fileUploadError'));
      },
    });
  }

  saveBranding(): void {
    const payload: AgencyTheme = {
      logoUrl: this.branding.logoUrl || undefined,
      faviconUrl: this.branding.faviconUrl || undefined,
      primaryColor: this.branding.primaryColor,
      secondaryColor: this.branding.secondaryColor,
      sidebarColor: this.branding.sidebarColor,
      menuColor: this.branding.menuColor,
      buttonColor: this.branding.buttonColor,
      backgroundColor: this.branding.backgroundColor,
      cardColor: this.branding.cardColor,
      textColor: this.branding.textColor,
      themeMode: this.branding.themeMode,
    };
    this.http.put<AgencyTheme>(this.api.agencies.branding, payload).subscribe({
      next: (res) => {
        this.theme.applyTheme(res, { transition: true });
        this.branding = this.mergeServerTheme(res);
        this.selectedPreset = this.detectPreset(this.branding);
        this.notif.success(this.i18n.instant('settings.themeSaved'));
      },
      error: () => this.notif.error(this.i18n.instant('settings.themeError')),
    });
  }
}

function eq(a?: string | null, b?: string | null): boolean {
  return norm(a) === norm(b);
}

function norm(c?: string | null): string {
  if (!c) return '';
  return c.trim().toUpperCase();
}
