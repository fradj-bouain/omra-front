import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number> | null): string {
    if (!key) return '';
    // Lit les signaux pour re-rendre le pipe quand les traductions ou la langue changent.
    this.i18n.loaded();
    this.i18n.currentLang();
    return this.i18n.instant(key, params ?? undefined);
  }
}
