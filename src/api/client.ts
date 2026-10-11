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
  ApiCatalogDto,
  TreasurySummaryResponseDto,
  GatewayReservesResponseDto,
  InvoicesResponseDto,
  EscalationsResponseDto,
  ReceiptsResponseDto,
  isApiCatalogDto,
  isTreasurySummaryResponseDto,
  isGatewayReservesResponseDto,
  isInvoicesResponseDto,
  isEscalationsResponseDto,
  isReceiptsResponseDto,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly status?: number,
    public readonly statusText?: string,
    public readonly responseBody?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
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

  // Build target URL ensuring relative base
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;

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
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;

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
