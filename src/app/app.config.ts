import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { I18nService } from './core/services/i18n.service';

export function i18nAppInitializer(i18n: I18nService) {
  return () => i18n.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [I18nService],
      useFactory: i18nAppInitializer,
    },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ]
};
