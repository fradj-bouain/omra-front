export interface HotelProperty {
  id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
}

export type HotelPricingUnit = 'PER_PERSON' | 'PER_ROOM' | 'PER_GROUP';
export type HotelOfferStatus = 'ACTIVE' | 'DISABLED';

export interface HotelOffer {
  id: number;
  propertyId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  status?: HotelOfferStatus;
  pricingUnit: HotelPricingUnit;
  price: number;
  currency: string;
  minUnits?: number | null;
  maxUnits?: number | null;
  validFrom: string;
  validTo: string;
  createdAt?: string;
}
