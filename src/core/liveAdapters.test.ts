/**
 * Unit Tests for Pure Live Bridge Adapters
 * Architecture: src/core/liveAdapters.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapStoreToEngineState,
  resolveFieldStatus,
  LIVE_READ_ONLY_REJECTION,
} from './liveAdapters';
import type { TreasuryStoreState } from '../api/store';
import type { TreasurySummaryViewModel } from '../api/types';

function createMockStoreState(overrides?: Partial<TreasuryStoreState>): TreasuryStoreState {
  return {
    summary: null,
    reserves: [],
    slabs: [],
    escalations: [],
    beancountRaw: null,
    catalog: null,
    loading: {
      summary: false,
      reserves: false,
      slabs: false,
      escalations: false,
      beancount: false,
    },
    errors: {
      summary: null,
      reserves: null,
      slabs: null,
      escalations: null,
      beancount: null,
    },
    lastUpdated: {
      summary: null,
      reserves: null,
      slabs: null,
      escalations: null,
      beancount: null,
    },
    ...overrides,
  };
}

const mockSummaryDto: TreasurySummaryViewModel = {
  totalCapital: 250000.50,
  liquidUsdc: 50000.50,
  usycVault: 200000.00,
  targetBuffer30D: 40000.00,
  policyWalletAddress: '0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0',
  agentAddress: '0x97aB6e781F034a8Cd0b60b1c6EA5a072529e8665',
  ownerAddress: '0xa9c97E3D0f95be9Fc990B3686997eC346D96833e',
  dailyLimit: 1000.00,
  spentToday: 120.00,
  dailyLimitRemaining: 880.00,
  maxSingleTx: 250.00,
  escalationNonce: 1,
  pendingEscalationsCount: 0,
  categoryLimits: { INFRASTRUCTURE: 500.00 },
  categorySpentToday: { INFRASTRUCTURE: 120.00 },
  liquidUsdcFormatted: '$50,000.50',
  usycVaultFormatted: '$200,000.00',
  totalCapitalFormatted: '$250,000.50',
  dailyLimitFormatted: '$1,000.00',
  spentTodayFormatted: '$120.00',
  dailyLimitRemainingFormatted: '$880.00',
  shouldSweepYield: false,
  sweepReason: 'Buffer within target',
  networkName: 'Arc Testnet (Chain ID 5042002)',
  chainId: 5042002,
  provenance: {
    liquidUsdc: 'live',
    usycVault: 'live',
    totalCapital: 'live',
    dailyLimit: 'live',
    spentToday: 'live',
    dailyLimitRemaining: 'live',
    addresses: 'live',
    pendingEscalationsCount: 'live',
    networkName: 'live',
    chainId: 'live',
  },
};

test('resolveFieldStatus resolves loading, live, stale, and unavailable correctly', () => {
  const now = 1000000;

  // 1. Loading
  const loading = resolveFieldStatus(false, false, null, now);
  assert.equal(loading.status, 'loading');

  // 2. Live
  const live = resolveFieldStatus(true, false, now - 1000, now);
  assert.equal(live.status, 'live');

  // 3. Stale (has data + has error)
  const stale = resolveFieldStatus(true, true, now - 5000, now);
  assert.equal(stale.status, 'stale');
  assert.equal(stale.ageMs, 5000);

  // 4. Unavailable (no data + has error)
  const unavailable = resolveFieldStatus(false, true, null, now);
  assert.equal(unavailable.status, 'unavailable');
});

test('mapStoreToEngineState handles loading state before initial fetch', () => {
  const store = createMockStoreState({
    loading: { summary: true, reserves: false, slabs: false, escalations: false, beancount: false },
  });

  const state = mapStoreToEngineState(store);

  assert.equal(state.isLiveBackend, false);
  assert.equal(state.telemetry.totalArcCapital.status, 'loading');
  assert.equal(state.telemetry.totalArcCapital.value, null);
  assert.equal(state.telemetry.totalArcCapital.provenance, 'live');
  assert.equal(state.balances.totalArcCapital, 0);
});

test('mapStoreToEngineState maps live authoritative summary data', () => {
  const store = createMockStoreState({
    summary: mockSummaryDto,
    lastUpdated: { summary: Date.now(), reserves: null, slabs: null, escalations: null, beancount: null },
  });

  const state = mapStoreToEngineState(store);

  assert.equal(state.isLiveBackend, true);
  assert.equal(state.balances.totalArcCapital, 250000.50);
  assert.equal(state.balances.arcLiquidUsdc, 50000.50);
  assert.equal(state.balances.arcUsycVault, 200000.00);

  // Telemetry checks
  assert.equal(state.telemetry.totalArcCapital.status, 'live');
  assert.equal(state.telemetry.totalArcCapital.value, 250000.50);
  assert.equal(state.telemetry.burnRate30D.provenance, 'static');
  assert.ok(state.telemetry.burnRate30D.marker?.includes('DATUM'));
  assert.equal(state.telemetry.blockHeight.provenance, 'static');
  assert.ok(state.telemetry.blockHeight.marker?.includes('5042002'));
});

test('mapStoreToEngineState tags stale values with elapsed ageMs upon error', () => {
  const now = 1700000000000;
  const store = createMockStoreState({
    summary: mockSummaryDto,
    lastUpdated: { summary: now - 30000, reserves: null, slabs: null, escalations: null, beancount: null },
    errors: { summary: new Error('500 Internal Server Error'), reserves: null, slabs: null, escalations: null, beancount: null },
  });

  const state = mapStoreToEngineState(store, null, now);

  assert.equal(state.telemetry.totalArcCapital.status, 'stale');
  assert.equal(state.telemetry.totalArcCapital.value, 250000.50);
  assert.equal(state.telemetry.totalArcCapital.ageMs, 30000);
});

test('mapStoreToEngineState tags unavailable on failure with zero prior data', () => {
  const store = createMockStoreState({
    summary: null,
    errors: { summary: new Error('ECONNREFUSED'), reserves: null, slabs: null, escalations: null, beancount: null },
  });

  const state = mapStoreToEngineState(store);

  assert.equal(state.telemetry.totalArcCapital.status, 'unavailable');
  assert.equal(state.telemetry.totalArcCapital.value, null);
  assert.equal(state.isLiveBackend, false);
});

test('mapStoreToEngineState handles empty receipts and escalations gracefully', () => {
  const now = Date.now();
  const store = createMockStoreState({
    summary: mockSummaryDto,
    slabs: [],
    escalations: [],
    lastUpdated: { summary: now, reserves: now, slabs: now, escalations: now, beancount: now },
  });

  const state = mapStoreToEngineState(store);

  assert.deepEqual(state.slabs, []);
  assert.deepEqual(state.escalations, []);
  assert.deepEqual(state.invoices, []);
  assert.equal(state.telemetry.slabs.status, 'live');
  assert.equal(state.telemetry.escalations.status, 'live');
});

test('LIVE_READ_ONLY_REJECTION rejects mutating actions', () => {
  assert.equal(LIVE_READ_ONLY_REJECTION.ok, false);
  assert.equal(LIVE_READ_ONLY_REJECTION.reason, 'READ_ONLY_LIVE');
});

test('mapStoreToEngineState marks unavailable on invalid summary payload without prior data (never zeros)', () => {
  // Scenario: fetch completed (lastUpdated set), but returned invalid payload so summary is null
  const store = createMockStoreState({
    summary: null,
    lastUpdated: { summary: 1700000000000, reserves: null, slabs: null, escalations: null, beancount: null },
  });

  const state = mapStoreToEngineState(store);

  assert.equal(state.telemetry.totalArcCapital.status, 'unavailable');
  assert.equal(state.telemetry.totalArcCapital.value, null);
  assert.equal(state.telemetry.arcLiquidUsdc.status, 'unavailable');
  assert.equal(state.telemetry.arcLiquidUsdc.value, null);
  assert.equal(state.telemetry.arcUsycVault.status, 'unavailable');
  assert.equal(state.telemetry.arcUsycVault.value, null);
});

test('mapStoreToEngineState marks telemetry unavailable for missing optional backend fields', () => {
  const partialSummary: TreasurySummaryViewModel = {
    ...mockSummaryDto,
    targetBuffer30D: undefined,
    maxSingleTx: undefined,
  };

  const store = createMockStoreState({
    summary: partialSummary,
    lastUpdated: { summary: Date.now(), reserves: null, slabs: null, escalations: null, beancount: null },
  });

  const state = mapStoreToEngineState(store);

  assert.equal(state.telemetry.targetBuffer30D.status, 'unavailable');
  assert.equal(state.telemetry.targetBuffer30D.value, null);
  assert.equal(state.telemetry.maxSingleTx.status, 'unavailable');
  assert.equal(state.telemetry.maxSingleTx.value, null);
});
