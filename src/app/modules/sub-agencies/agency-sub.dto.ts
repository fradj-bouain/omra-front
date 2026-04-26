/** Quota sous-agences (GET .../sub-agency-quota). */
export interface SubAgencyQuotaDto {
  activeSubAgencies: number;
  maxSubAgencies: number | null;
  canCreate: boolean;
}

/** Aligné sur {@code AgencyDto} côté API (liste, création, mise à jour). */
export interface AgencySubDto {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  currency?: string | null;
  city?: string | null;
  address?: string | null;
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
  themeMode?: 'LIGHT' | 'DARK' | null;
  status?: string | null;
  /** Same as root agency; sub-agencies inherit parent kind. */
  agencyKind?: 'TRAVEL' | 'MARKETPLACE' | 'HOTEL' | null;
  parentAgencyId?: number | null;
}
