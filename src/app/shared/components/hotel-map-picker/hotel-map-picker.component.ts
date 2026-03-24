import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { environment } from '../../../../environments/environment';

export interface HotelMapLocation {
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  country: string | null;
}

/** API Google Maps chargée dynamiquement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

@Component({
  selector: 'app-hotel-map-picker',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './hotel-map-picker.component.html',
  styleUrl: './hotel-map-picker.component.scss',
})
export class HotelMapPickerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  @Output() locationSelected = new EventEmitter<HotelMapLocation>();

  @Input() initialLatitude: number | null = null;
  @Input() initialLongitude: number | null = null;

  loading = true;
  error: string | null = null;
  hintCoords = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private marker: any = null;
  private geocoder: any = null;
  private listeners: any[] = [];

  constructor(private mapsLoader: GoogleMapsLoaderService) {}

  ngAfterViewInit(): void {
    const key = environment.googleMapsApiKey;
    if (!key) {
      this.loading = false;
      this.error =
        'Configurez googleMapsApiKey dans src/environments/environment.ts (API Maps JavaScript + Places).';
      return;
    }

    this.mapsLoader
      .load(key)
      .then(() => this.initMap())
      .catch((e: Error) => {
        this.loading = false;
        this.error = e.message || 'Erreur de chargement Google Maps';
      });
  }

  ngOnDestroy(): void {
    for (const l of this.listeners) {
      if (l) google.maps.event.removeListener(l);
    }
    this.listeners = [];
    this.marker = null;
    this.map = null;
  }

  private initMap(): void {
    const el = this.mapContainer?.nativeElement;
    const searchEl = this.searchInput?.nativeElement;
    if (!el || !searchEl) {
      this.loading = false;
      return;
    }

    const defaultCenter = { lat: 21.4225, lng: 39.8262 };
    let lat =
      this.initialLatitude != null && !Number.isNaN(this.initialLatitude)
        ? this.initialLatitude
        : defaultCenter.lat;
    let lng =
      this.initialLongitude != null && !Number.isNaN(this.initialLongitude)
        ? this.initialLongitude
        : defaultCenter.lng;

    this.map = new google.maps.Map(el, {
      center: { lat, lng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    this.marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      draggable: true,
      title: 'Position de l’hôtel',
    });

    this.geocoder = new google.maps.Geocoder();

    const autocomplete = new google.maps.places.Autocomplete(searchEl, {
      fields: ['formatted_address', 'geometry', 'address_components', 'name'],
    });
    autocomplete.bindTo('bounds', this.map);

    const onPlace = () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      lat = place.geometry.location.lat();
      lng = place.geometry.location.lng();
      this.map.setCenter({ lat, lng });
      this.map.setZoom(17);
      this.marker.setPosition({ lat, lng });
      this.emitFromPlace(place);
    };

    this.listeners.push(autocomplete.addListener('place_changed', onPlace));

    this.listeners.push(
      this.map.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
        if (!e.latLng) return;
        lat = e.latLng.lat();
        lng = e.latLng.lng();
        this.marker.setPosition(e.latLng);
        this.reverseGeocode(e.latLng);
      })
    );

    this.listeners.push(
      this.marker.addListener('dragend', () => {
        const p = this.marker.getPosition();
        if (!p) return;
        lat = p.lat();
        lng = p.lng();
        this.reverseGeocode(p);
      })
    );

    this.loading = false;
    this.updateHint(lat, lng);

    if (this.initialLatitude != null && this.initialLongitude != null) {
      this.reverseGeocode({ lat: this.initialLatitude, lng: this.initialLongitude });
    }
  }

  private reverseGeocode(latLng: { lat: number; lng: number } | { lat: () => number; lng: () => number }): void {
    if (!this.geocoder) return;
    const ll =
      typeof latLng.lat === 'function'
        ? { lat: latLng.lat(), lng: (latLng as { lat: () => number; lng: () => number }).lng() }
        : (latLng as { lat: number; lng: number });

    this.geocoder.geocode({ location: ll }, (results: any[], status: string) => {
      if (status !== 'OK' || !results?.[0]) {
        this.emitLocation(ll.lat, ll.lng, null, null, null);
        return;
      }
      const r = results[0];
      const { city, country } = this.parseComponents(r.address_components);
      this.emitLocation(
        r.geometry.location.lat(),
        r.geometry.location.lng(),
        r.formatted_address ?? null,
        city,
        country
      );
    });
  }

  private emitFromPlace(place: {
    geometry: { location: { lat: () => number; lng: () => number } };
    formatted_address?: string;
    address_components?: { long_name: string; types: string[] }[];
  }): void {
    const loc = place.geometry.location;
    const lat = loc.lat();
    const lng = loc.lng();
    const { city, country } = this.parseComponents(place.address_components);
    this.emitLocation(lat, lng, place.formatted_address ?? null, city, country);
  }

  private parseComponents(components: { long_name: string; types: string[] }[] | undefined): {
    city: string | null;
    country: string | null;
  } {
    let city: string | null = null;
    let country: string | null = null;
    if (!components) return { city, country };
    for (const c of components) {
      if (c.types.includes('locality')) city = c.long_name;
      if (c.types.includes('administrative_area_level_1') && !city) city = c.long_name;
      if (c.types.includes('country')) country = c.long_name;
    }
    return { city, country };
  }

  private emitLocation(
    lat: number,
    lng: number,
    address: string | null,
    city: string | null,
    country: string | null
  ): void {
    this.updateHint(lat, lng);
    this.locationSelected.emit({
      latitude: lat,
      longitude: lng,
      address,
      city,
      country,
    });
  }

  private updateHint(lat: number, lng: number): void {
    this.hintCoords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
