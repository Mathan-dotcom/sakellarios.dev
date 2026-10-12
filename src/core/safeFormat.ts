/**
 * Pure Safe Formatting Utilities
 * Architecture: src/core/safeFormat.ts
 * 
 * Invariants:
 * - With flag on, missing, undefined, null, NaN, or Infinite values NEVER throw
 *   and NEVER render "undefined", "NaN", or "Infinity".
 * - For valid finite numeric inputs, output is byte-identical to standard
 *   toFixed(N) and toLocaleString(locales, options) calls.
 * - Missing/invalid inputs render neutral fallback ("UNAVAILABLE" or "--").
 */

export function safeToFixed(
  value: unknown,
  digits = 2,
  fallback = 'UNAVAILABLE'
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(digits);
  }
  return fallback;
}

export function safeToLocaleString(
  value: unknown,
  locales = 'en-US',
  options?: Intl.NumberFormatOptions,
  fallback = 'UNAVAILABLE'
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString(locales, options);
  }
  return fallback;
}

export function safeCurrency(
  value: unknown,
  prefix = '$',
  options: Intl.NumberFormatOptions = { minimumFractionDigits: 2 },
  fallback = 'UNAVAILABLE'
): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${prefix}${value.toLocaleString('en-US', options)}`;
  }
  return fallback;
}

export function safeSurplus(
  liquid: unknown,
  buffer: unknown
): number | null {
  if (
    typeof liquid === 'number' &&
    Number.isFinite(liquid) &&
    typeof buffer === 'number' &&
    Number.isFinite(buffer)
  ) {
    return Math.max(0, liquid - buffer);
  }
  return null;
}

export function safeFormatNonce(
  nonce: unknown,
  prefix = 'NONCE #',
  fallback = 'UNAVAILABLE'
): string {
  if (typeof nonce === 'number' && Number.isFinite(nonce)) {
    return `${prefix}${nonce}`;
  }
  return fallback;
}
