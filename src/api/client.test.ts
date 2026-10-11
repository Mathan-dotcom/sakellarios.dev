/**
 * Unit Tests for API Client & Runtime Type Guards
 * Runner: Node 22 native test runner (node --experimental-strip-types --test)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  forbidMutatingRequest,
  UnsupportedMethodError,
  ApiError,
  TimeoutError,
  NetworkError,
  ValidationError,
  getApiBaseUrl,
  USE_LIVE_DATA,
} from './client';
import {
  isRecord,
  isApiCatalogDto,
  isTreasurySummaryResponseDto,
  isGatewayReservesResponseDto,
  isReceiptsResponseDto,
  isErrorResponseDto,
} from './types';

test('forbidMutatingRequest throws UnsupportedMethodError on any non-GET method', () => {
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH', 'post', 'delete'];
  for (const method of mutatingMethods) {
    assert.throws(
      () => forbidMutatingRequest(method, '/api/invoices/process'),
      (err: unknown) => {
        assert(err instanceof UnsupportedMethodError);
        assert.equal(err.status, 405);
        assert.match(err.message, /forbidden/);
        return true;
      }
    );
  }
});

test('getApiBaseUrl defaults to relative /api and trims trailing slashes', () => {
  const base = getApiBaseUrl();
  assert(base.startsWith('/api') || base.startsWith('http'));
  assert.equal(base.endsWith('/'), false, 'Base URL must not have trailing slashes');
  assert.equal(base.includes(':4000'), false, 'Client must never default to :4000');
});

test('USE_LIVE_DATA defaults to false', () => {
  assert.equal(typeof USE_LIVE_DATA, 'boolean');
  // Default is false unless VITE_USE_LIVE_DATA is explicitly true
  if (!process.env.VITE_USE_LIVE_DATA) {
    assert.equal(USE_LIVE_DATA, false);
  }
});

test('Error classes instantiate with expected fields', () => {
  const generic = new ApiError('generic error', '/api/test', 500, 'Server Error');
  assert.equal(generic.status, 500);
  assert.equal(generic.endpoint, '/api/test');

  const timeout = new TimeoutError('/api/test', 5000);
  assert.equal(timeout.status, 408);
  assert.equal(timeout.endpoint, '/api/test');

  const net = new NetworkError('/api/test', new Error('ECONNREFUSED'));
  assert.equal(net.status, 0);

  const val = new ValidationError('/api/test', 'bad payload', { foo: 'bar' });
  assert.equal(val.status, 502);
});

test('Runtime type guards validate shapes accurately without throwing', () => {
  assert.equal(isRecord(null), false);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord({ a: 1 }), true);

  // Catalog
  assert.equal(
    isApiCatalogDto({
      service: 'test',
      status: 'ONLINE',
      network: 'Arc L1',
      policyWallet: '0x1',
      endpoints: { a: 'b' },
    }),
    true
  );
  assert.equal(isApiCatalogDto({ service: 'incomplete' }), false);

  // Treasury Summary
  const validSummary = {
    success: true,
    data: {
      policyWallet: {
        address: '0x1',
        dailyLimit: 1000,
        spentToday: 0,
      },
      balances: {
        arcLiquidUsdc: 2,
        arcUsycVault: 0,
      },
      cashFlowForecasting: {},
      pendingEscalationsCount: 0,
    },
  };
  assert.equal(isTreasurySummaryResponseDto(validSummary), true);
  assert.equal(isTreasurySummaryResponseDto({ success: false }), false);

  // Gateway Reserves
  assert.equal(isGatewayReservesResponseDto({ success: true, data: { gatewayStatus: 'ONLINE', chains: [] } }), true);
  assert.equal(isGatewayReservesResponseDto({ success: true, data: { gatewayStatus: 'ONLINE', chains: 'invalid' } }), false);

  // Receipts
  assert.equal(isReceiptsResponseDto({ success: true, data: [] }), true);
  assert.equal(isReceiptsResponseDto({ success: false, data: [] }), false);

  // Error envelope
  assert.equal(isErrorResponseDto({ success: false, error: 'fail' }), true);
  assert.equal(isErrorResponseDto({ success: true, data: [] }), false);
});
