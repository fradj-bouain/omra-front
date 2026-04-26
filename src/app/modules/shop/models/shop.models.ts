export interface ShopProduct {
  id: number;
  marketplaceId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  currency: string;
  inStock: boolean;
  stockQuantity?: number | null;
}

export interface ShopProductWritePayload {
  title: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  inStock?: boolean;
  stockQuantity?: number | null;
}

export interface ShopOrderSummary {
  id: number;
  pilgrimId: number;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
