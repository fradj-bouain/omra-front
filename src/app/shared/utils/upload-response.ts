/** Extrait l’URL renvoyée par POST /api/files/upload (clés snake_case ou camelCase, corps éventuellement null). */
export function fileUrlFromUploadResponse(res: unknown): string | undefined {
  if (res == null || typeof res !== 'object') return undefined;
  const r = res as Record<string, unknown>;
  for (const key of ['file_url', 'fileUrl', 'url'] as const) {
    const v = r[key];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return undefined;
}
