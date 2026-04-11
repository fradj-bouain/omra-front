import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeFr, 'fr-FR');
registerLocaleData(localeAr, 'ar');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
