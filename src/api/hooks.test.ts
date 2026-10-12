/**
 * Unit Tests for React Integration Hooks & Store Contract
 * Architecture: src/api/hooks.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { treasuryStore } from './store';
import {
  useTreasuryStore,
  useTreasurySummary,
  useGatewayReserves,
  useSlabs,
  useEscalations,
} from './hooks';

test('hooks exports expected hook functions', () => {
  assert.equal(typeof useTreasuryStore, 'function');
  assert.equal(typeof useTreasurySummary, 'function');
  assert.equal(typeof useGatewayReserves, 'function');
  assert.equal(typeof useSlabs, 'function');
  assert.equal(typeof useEscalations, 'function');
});

test('treasuryStore conforms to useSyncExternalStore contract', () => {
  const state = treasuryStore.getState();
  assert.ok(state !== null && typeof state === 'object');
  assert.ok('summary' in state);
  assert.ok('reserves' in state);
  assert.ok('slabs' in state);
  assert.ok('escalations' in state);
  assert.ok('loading' in state);
  assert.ok('errors' in state);
  assert.ok('lastUpdated' in state);

  // Subscribe contract
  let receivedState = null;
  const unsubscribe = treasuryStore.subscribe((s) => {
    receivedState = s;
  });

  assert.equal(typeof unsubscribe, 'function');
  // Immediately called upon subscription
  assert.deepEqual(receivedState, state);

  // Unsubscribe cleanly
  unsubscribe();
});

test('treasuryStore startPolling and stopPolling toggle polling lifecycle', () => {
  treasuryStore.startPolling();
  // Safe to call redundantly
  treasuryStore.startPolling();
  treasuryStore.stopPolling();
  // Safe to call redundantly
  treasuryStore.stopPolling();
  assert.ok(true, 'Polling lifecycle managed cleanly without throwing');
});
