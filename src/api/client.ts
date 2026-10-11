/**
 * Safe, GET-Only HTTP Client for Backend Integration
 * Reference: docs/integration/CONTRACT.md
 * Constraints:
 * - Throws on ANY HTTP method other than GET
 * - Zero mutating route handlers
 * - Relative base "/api"
 * - Timeout via AbortSignal.timeout or custom timeout
 * - Bounded retry with exponential backoff for GET requests
 * - Typed errors
 */

import {
  type ApiCatalogDto,
  type TreasurySummaryResponseDto,
  type GatewayReservesResponseDto,
  type InvoicesResponseDto,
  type EscalationsResponseDto,
  type ReceiptsResponseDto,
  isApiCatalogDto,
  isTreasurySummaryResponseDto,
  isGatewayReservesResponseDto,
  isInvoicesResponseDto,
  isEscalationsResponseDto,
  isReceiptsResponseDto,
} from './types';

export class ApiError extends Error {
  public readonly endpoint: string;
  public readonly status?: number;
  public readonly statusText?: string;
  public readonly responseBody?: unknown;

  constructor(
    message: string,
    endpoint: string,
    status?: number,
    statusText?: string,
    responseBody?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
  }
}

export class UnsupportedMethodError extends ApiError {
  constructor(method: string, endpoint: string) {
    super(
      `Method ${method} is forbidden on ${endpoint}. Client is strictly read-only (GET only).`,
      endpoint,
      405,
      'Method Not Allowed'
    );
    this.name = 'UnsupportedMethodError';
  }
}

export class TimeoutError extends ApiError {
  constructor(endpoint: string, timeoutMs: number) {
    super(`Request to ${endpoint} timed out after ${timeoutMs}ms.`, endpoint, 408, 'Request Timeout');
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends ApiError {
  constructor(endpoint: string, cause: unknown) {
    super(
      `Network failure requesting ${endpoint}: ${cause instanceof Error ? cause.message : String(cause)}`,
      endpoint,
      0,
      'Network Error'
    );
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ApiError {
  constructor(endpoint: string, message: string, payload: unknown) {
    super(`Contract validation failed on ${endpoint}: ${message}`, endpoint, 502, 'Bad Gateway', payload);
    this.name = 'ValidationError';
  }
}

/**
 * Global Feature Flag (Decision D3 & Part B.3)
 * Enabled only when VITE_USE_LIVE_DATA is explicitly set to "true". Default is false.
 */
export const USE_LIVE_DATA: boolean =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_LIVE_DATA === 'true';

/**
 * Resolves the active base URL for API requests.
 * Priority:
 * 1. import.meta.env.VITE_API_BASE (with any trailing slashes trimmed)
 * 2. Fallback to relative "/api"
 *
 * NOTE ON MIXED CONTENT & SECURITY:
 * When this application is hosted on an HTTPS origin (e.g. https://sakellarious.dev or Vercel),
 * web browsers strictly block any direct unencrypted HTTP requests to http://localhost:4000
 * due to W3C Mixed Content security restrictions.
 * In production or cloud deployments, VITE_API_BASE must point to a secure HTTPS endpoint
 * or rely on a relative reverse-proxy path (/api).
 * The client strictly executes GET requests and never defaults to http://localhost:4000.
 */
export function getApiBaseUrl(): string {
  const envBase =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE
      ? String(import.meta.env.VITE_API_BASE).replace(/\/+$/, '')
      : '';
  return envBase || '/api';
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_INITIAL_BACKOFF_MS = 300;

/**
 * Low-level GET request runner with bounded exponential backoff.
 * Throws immediately if method is non-GET.
 */
export async function getJson<T>(
  endpoint: string,
  validator: (data: unknown) => data is T,
  options: RequestOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const initialBackoffMs = options.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;

  // Build target URL respecting dynamic base
  const apiBase = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith(apiBase)
    ? cleanEndpoint
    : cleanEndpoint.startsWith('/api')
    ? `${apiBase}${cleanEndpoint.slice(4)}`
    : `${apiBase}${cleanEndpoint}`;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    // Check if external signal already aborted
    if (options.signal?.aborted) {
      throw new ApiError('Request aborted by caller', url);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new TimeoutError(url, timeoutMs));
    }, timeoutMs);

    // Merge external abort signal if provided
    const onExternalAbort = () => controller.abort(options.signal?.reason);
    if (options.signal) {
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (options.signal) {
        options.signal.removeEventListener('abort', onExternalAbort);
      }

      if (!response.ok) {
        let errBody: unknown;
        try {
          errBody = await response.json();
        } catch {
          errBody = await response.text();
        }

        const is5xx = response.status >= 500 && response.status < 600;
        const apiErr = new ApiError(
          `GET ${url} responded with HTTP ${response.status} ${response.statusText}`,
          url,
          response.status,
          response.statusText,
          errBody
        );

        // Only retry on 5xx server errors; 4xx errors fail immediately
        if (is5xx && attempt < maxRetries) {
          lastError = apiErr;
          attempt++;
          const delay = initialBackoffMs * Math.pow(2, attempt - 1);
          await sleep(delay);
          continue;
        }

        throw apiErr;
      }

      const json = await response.json();
      if (!validator(json)) {
        throw new ValidationError(url, 'Response failed runtime contract validation', json);
      }

      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      if (options.signal) {
        options.signal.removeEventListener('abort', onExternalAbort);
      }

      if (err instanceof ApiError && err.status && err.status < 500) {
        throw err;
      }

      const isTimeout =
        (err instanceof TimeoutError) ||
        (err instanceof Error && err.name === 'AbortError' && controller.signal.aborted);

      const normalizedErr = isTimeout
        ? new TimeoutError(url, timeoutMs)
        : err instanceof ApiError
        ? err
        : new NetworkError(url, err);

      lastError = normalizedErr;

      if (attempt < maxRetries && !options.signal?.aborted) {
        attempt++;
        const delay = initialBackoffMs * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new ApiError('Unexpected retry loop exit', url);
}

/**
 * Text fetcher for raw string routes such as /api/audit/beancount
 */
export async function getText(endpoint: string, options: RequestOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const apiBase = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith(apiBase)
    ? cleanEndpoint
    : cleanEndpoint.startsWith('/api')
    ? `${apiBase}${cleanEndpoint.slice(4)}`
    : `${apiBase}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new TimeoutError(url, timeoutMs)), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/plain, */*' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`GET ${url} responded with ${response.status}`, url, response.status, response.statusText);
    }
    return await response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    throw new NetworkError(url, err);
  }
}

/**
 * Guard that strictly rejects any attempt to execute non-GET requests.
 */
export function forbidMutatingRequest(method: string, endpoint: string): never {
  throw new UnsupportedMethodError(method, endpoint);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Authoritative GET Endpoint Functions
// ============================================================================

export function fetchApiCatalog(options?: RequestOptions): Promise<ApiCatalogDto> {
  return getJson<ApiCatalogDto>('/api', isApiCatalogDto, options);
}

export function fetchTreasurySummary(options?: RequestOptions): Promise<TreasurySummaryResponseDto> {
  return getJson<TreasurySummaryResponseDto>('/api/treasury/summary', isTreasurySummaryResponseDto, options);
}

export function fetchGatewayReserves(options?: RequestOptions): Promise<GatewayReservesResponseDto> {
  return getJson<GatewayReservesResponseDto>('/api/treasury/gateway-reserves', isGatewayReservesResponseDto, options);
}

export function fetchInvoices(options?: RequestOptions): Promise<InvoicesResponseDto> {
  return getJson<InvoicesResponseDto>('/api/invoices', isInvoicesResponseDto, options);
}

export function fetchEscalations(options?: RequestOptions): Promise<EscalationsResponseDto> {
  return getJson<EscalationsResponseDto>('/api/escalations', isEscalationsResponseDto, options);
}

export function fetchReceipts(options?: RequestOptions): Promise<ReceiptsResponseDto> {
  return getJson<ReceiptsResponseDto>('/api/audit/receipts', isReceiptsResponseDto, options);
}

export function fetchBeancountLedger(options?: RequestOptions): Promise<string> {
  return getText('/api/audit/beancount', options);
}
