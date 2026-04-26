export type MarketplaceStatus = 'ACTIVE' | 'INACTIVE';
export type MarketplaceCatalogType = 'MANUAL' | 'EXTERNAL_API';

export interface MarketplaceDto {
  id: number;
  agencyId?: number;
  name: string;
  description?: string | null;
  status: MarketplaceStatus;
  catalogType: MarketplaceCatalogType;
  apiBaseUrl?: string | null;
  apiAuthHeader?: string | null;
  apiAuthValue?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type MarketplaceCreateUpdatePayload = Partial<
  Pick<
    MarketplaceDto,
    | 'name'
    | 'description'
    | 'status'
    | 'catalogType'
    | 'apiBaseUrl'
    | 'apiAuthHeader'
    | 'apiAuthValue'
  >
>;

