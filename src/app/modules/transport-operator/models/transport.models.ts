export type TransportVehicleType = 'BUS' | 'CAR' | 'VAN' | 'MINIBUS' | 'OTHER';
export type TransportPricingUnit = 'DAY' | 'HOUR' | 'TRIP';
export type TransportOfferStatus = 'ACTIVE' | 'DISABLED';

export interface TransportVehicle {
  id: number;
  vehicleType: TransportVehicleType;
  seatCount: number;
  plate?: string | null;
  brand?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  driverEmail?: string | null;
  address?: string | null;
  createdAt?: string;
}

export interface TransportOffer {
  id: number;
  vehicleId: number;
  transportAgencyId?: number;
  transportAgencyName?: string | null;
  vehicleType?: TransportVehicleType | null;
  vehicleSeatCount?: number | null;
  vehiclePlate?: string | null;
  vehicleBrand?: string | null;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  status: TransportOfferStatus;
  pricingUnit: TransportPricingUnit;
  price: number;
  currency: string;
  minUnits?: number | null;
  maxUnits?: number | null;
  validFrom: string;
  validTo: string;
  createdAt?: string;
}
