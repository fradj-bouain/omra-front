import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/** Required for DatePipe, DecimalPipe, etc. when LOCALE_ID is fr-FR */
registerLocaleData(localeFr, 'fr-FR');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
