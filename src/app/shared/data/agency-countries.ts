/** ISO 3166-1 alpha-2 — liste courte (Omra / agences voyage), tri FR. */
export interface AgencyCountry {
  code: string;
  nameFr: string;
}

export const AGENCY_COUNTRIES: AgencyCountry[] = [
  { code: 'DZ', nameFr: 'Algérie' },
  { code: 'DE', nameFr: 'Allemagne' },
  { code: 'SA', nameFr: 'Arabie saoudite' },
  { code: 'BE', nameFr: 'Belgique' },
  { code: 'BA', nameFr: 'Bosnie-Herzégovine' },
  { code: 'CA', nameFr: 'Canada' },
  { code: 'CN', nameFr: 'Chine' },
  { code: 'KR', nameFr: 'Corée du Sud' },
  { code: 'CI', nameFr: "Côte d'Ivoire" },
  { code: 'EG', nameFr: 'Égypte' },
  { code: 'AE', nameFr: 'Émirats arabes unis' },
  { code: 'ES', nameFr: 'Espagne' },
  { code: 'US', nameFr: 'États-Unis' },
  { code: 'FR', nameFr: 'France' },
  { code: 'GB', nameFr: 'Royaume-Uni' },
  { code: 'IT', nameFr: 'Italie' },
  { code: 'JP', nameFr: 'Japon' },
  { code: 'KW', nameFr: 'Koweït' },
  { code: 'LB', nameFr: 'Liban' },
  { code: 'LU', nameFr: 'Luxembourg' },
  { code: 'MA', nameFr: 'Maroc' },
  { code: 'MU', nameFr: 'Maurice' },
  { code: 'NL', nameFr: 'Pays-Bas' },
  { code: 'QA', nameFr: 'Qatar' },
  { code: 'SN', nameFr: 'Sénégal' },
  { code: 'CH', nameFr: 'Suisse' },
  { code: 'TN', nameFr: 'Tunisie' },
  { code: 'TR', nameFr: 'Turquie' },
].sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'));

export function agencyCountryLabel(code: string | null | undefined): string {
  const c = code?.trim();
  if (!c) return '';
  const row = AGENCY_COUNTRIES.find((x) => x.code === c.toUpperCase());
  return row ? `${row.nameFr} (${row.code})` : c;
}
