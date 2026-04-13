/** ISO 4217 — devises courantes pour les agences. */
export interface AgencyCurrency {
  code: string;
  labelFr: string;
}

export const AGENCY_CURRENCIES: AgencyCurrency[] = [
  { code: 'MAD', labelFr: 'MAD — Dirham marocain' },
  { code: 'EUR', labelFr: 'EUR — Euro' },
  { code: 'USD', labelFr: 'USD — Dollar US' },
  { code: 'GBP', labelFr: 'GBP — Livre sterling' },
  { code: 'CHF', labelFr: 'CHF — Franc suisse' },
  { code: 'SAR', labelFr: 'SAR — Riyal saoudien' },
  { code: 'AED', labelFr: 'AED — Dirham émirati' },
  { code: 'TND', labelFr: 'TND — Dinar tunisien' },
  { code: 'DZD', labelFr: 'DZD — Dinar algérien' },
  { code: 'EGP', labelFr: 'EGP — Livre égyptienne' },
  { code: 'QAR', labelFr: 'QAR — Riyal qatari' },
  { code: 'KWD', labelFr: 'KWD — Dinar koweïtien' },
  { code: 'CAD', labelFr: 'CAD — Dollar canadien' },
].sort((a, b) => a.code.localeCompare(b.code, 'fr'));

export function agencyCurrencyLabel(raw: string | null | undefined): string {
  const t = raw?.trim();
  if (!t) {
    return '';
  }
  const upper = t.toUpperCase();
  const row = AGENCY_CURRENCIES.find((c) => c.code === upper);
  return row ? row.labelFr : t;
}
