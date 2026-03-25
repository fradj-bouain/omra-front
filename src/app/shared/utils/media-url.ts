import { environment } from '../../../environments/environment';

/**
 * URL absolue pour affichage (img, favicon, lien) : préfixe l’API si le backend renvoie un chemin /uploads/...
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (url == null || url === '') return '';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('blob:')) {
    return u;
  }
  if (u.startsWith('/')) {
    return `${environment.apiUrl}${u}`;
  }
  return u;
}
