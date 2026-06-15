/**
 * Sanitizes text extracted from PDFs for safe storage in PostgreSQL JSON columns.
 *
 * PostgreSQL rejects certain Unicode sequences in JSON/JSONB columns:
 * - Null character (\u0000)
 * - Lone surrogates (\uD800-\uDFFF)
 *
 * This function strips those characters to prevent "unsupported Unicode escape sequence" errors.
 */
export function sanitizeTextForJson(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u0000|[\uD800-\uDFFF]/g, '');
}
