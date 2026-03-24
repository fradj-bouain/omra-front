import { Injectable } from '@angular/core';

const MAPS_CALLBACK = '__omraGoogleMapsInit';

function mapsAlreadyLoaded(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as { google?: { maps?: unknown } }).google?.maps;
}

/**
 * Charge une seule fois l’API JavaScript Google Maps (+ bibliothèque places).
 */
@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(apiKey: string): Promise<void> {
    if (!apiKey?.trim()) {
      return Promise.reject(new Error('Clé API Google Maps manquante (environment.googleMapsApiKey).'));
    }
    if (mapsAlreadyLoaded()) {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = new Promise<void>((resolve, reject) => {
      (window as unknown as Record<string, () => void>)[MAPS_CALLBACK] = () => {
        resolve();
        delete (window as unknown as Record<string, unknown>)[MAPS_CALLBACK];
      };
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&libraries=places&callback=${MAPS_CALLBACK}`;
      script.onerror = () => {
        this.loadPromise = null;
        reject(new Error('Impossible de charger Google Maps.'));
      };
      document.head.appendChild(script);
    });
    return this.loadPromise;
  }
}
