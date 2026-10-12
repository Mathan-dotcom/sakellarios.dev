/**
 * React Integration Hooks for Treasury Telemetry Store
 * Architecture: src/api/hooks.ts
 * 
 * Uses useSyncExternalStore to subscribe to the shared treasuryStore singleton.
 * Safe for concurrent React rendering, zero state tearing, automatic visibility awareness.
 */

import { useSyncExternalStore, useEffect } from 'react';
import { treasuryStore, type TreasuryStoreState } from './store';

/**
 * Primary React hook subscribing to the full TreasuryStoreState.
 * Automatically activates store polling on mount.
 */
export function useTreasuryStore(): TreasuryStoreState {
  useEffect(() => {
    treasuryStore.startPolling();
  }, []);

  return useSyncExternalStore(
    (callback) => treasuryStore.subscribe(callback),
    () => treasuryStore.getState(),
    () => treasuryStore.getState()
  );
}

/**
 * Selector hook subscribing only to treasury summary telemetry.
 */
export function useTreasurySummary() {
  const store = useTreasuryStore();
  return {
    summary: store.summary,
    loading: store.loading.summary,
    error: store.errors.summary,
    lastUpdated: store.lastUpdated.summary,
  };
}

/**
 * Selector hook subscribing only to multichain reserves telemetry.
 */
export function useGatewayReserves() {
  const store = useTreasuryStore();
  return {
    reserves: store.reserves,
    loading: store.loading.reserves,
    error: store.errors.reserves,
    lastUpdated: store.lastUpdated.reserves,
  };
}

/**
 * Selector hook subscribing only to Data Loom ledger slabs.
 */
export function useSlabs() {
  const store = useTreasuryStore();
  return {
    slabs: store.slabs,
    loading: store.loading.slabs,
    error: store.errors.slabs,
    lastUpdated: store.lastUpdated.slabs,
  };
}

/**
 * Selector hook subscribing only to supervisor escalations.
 */
export function useEscalations() {
  const store = useTreasuryStore();
  return {
    escalations: store.escalations,
    loading: store.loading.escalations,
    error: store.errors.escalations,
    lastUpdated: store.lastUpdated.escalations,
  };
}
