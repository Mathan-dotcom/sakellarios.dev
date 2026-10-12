/**
 * Live Reactive Headless Engine Bridge
 * Architecture: src/core/useLiveSakellariousEngine.ts
 * 
 * STRICT CONSTRAINTS:
 * - Read-only bridge: zero mutating requests, zero offline fake fallbacks.
 * - Powered exclusively by useSyncExternalStore over shared treasuryStore.
 * - Never initiates uncoordinated setInterval polling.
 * - Mutating action dispatchers return { ok: false, reason: 'READ_ONLY_LIVE' }.
 */

import { useMemo, useCallback, useRef } from 'react';
import { useTreasuryStore } from '../api/hooks';
import { treasuryStore } from '../api/store';
import {
  mapStoreToEngineState,
  LIVE_READ_ONLY_REJECTION,
  type LiveEngineState,
} from './liveAdapters';
import type {
  InvoiceSubmissionPayload,
} from './useLegacySakellariousEngine';

export function useLiveSakellariousEngine() {
  const storeState = useTreasuryStore();
  const prevStateRef = useRef<LiveEngineState | null>(null);

  const mapped = useMemo(() => {
    const next = mapStoreToEngineState(storeState, prevStateRef.current);
    prevStateRef.current = next;
    return next;
  }, [storeState]);

  // Read-only action handlers per Condition 1 & 4
  const checkSanctions = useCallback(async (addressOrEntity: string) => {
    return {
      addressOrEntity,
      isSanctioned: false,
      screenedAt: Date.now(),
      status: 'UNSCREENED' as const,
      entityName: 'Unscreened (Live Mode Read-Only)',
      ...LIVE_READ_ONLY_REJECTION,
    };
  }, []);

  const processInvoice = useCallback(async (_payload: InvoiceSubmissionPayload) => {
    return {
      status: 'REVERTED' as const,
      message: 'Policy Read-Only: Mutating invoice execution is disabled in live mode.',
      txHash: undefined,
      escalationId: undefined,
      ...LIVE_READ_ONLY_REJECTION,
    };
  }, []);

  const approveEscalation = useCallback(async (_txId: string, _callerAddress?: string) => {
    return {
      success: false as const,
      txHash: undefined,
      ...LIVE_READ_ONLY_REJECTION,
    };
  }, []);

  const cancelEscalation = useCallback(async (_txId: string, _callerAddress?: string) => {
    return {
      success: false as const,
      ...LIVE_READ_ONLY_REJECTION,
    };
  }, []);

  const sweepSurplusYield = useCallback(async () => {
    return {
      swept: false as const,
      amount: 0,
      txHash: undefined,
      ...LIVE_READ_ONLY_REJECTION,
    };
  }, []);

  const redeemYield = useCallback(async (_amount: number) => {
    return {
      success: false as const,
      amountRedeemed: 0,
      txHash: undefined,
      ...LIVE_READ_ONLY_REJECTION,
    };
  }, []);

  const resetEscalationDemo = useCallback(() => {
    // Zero-op in live mode: real telemetry is never reset locally
  }, []);

  // Safe GET-only refresh delegates
  const refreshAll = useCallback(async () => {
    await Promise.all([
      treasuryStore.refreshSummary(),
      treasuryStore.refreshReserves(),
      treasuryStore.refreshSlabs(),
      treasuryStore.refreshEscalations(),
      treasuryStore.refreshBeancount(),
    ]);
  }, []);

  const fetchSummary = useCallback(async () => {
    await treasuryStore.refreshSummary();
  }, []);

  const fetchReserves = useCallback(async () => {
    await treasuryStore.refreshReserves();
  }, []);

  const fetchEscalations = useCallback(async () => {
    await treasuryStore.refreshEscalations();
  }, []);

  const fetchAuditLedger = useCallback(async () => {
    await Promise.all([
      treasuryStore.refreshBeancount(),
      treasuryStore.refreshSlabs(),
    ]);
  }, []);

  return useMemo(() => ({
    // Data streams
    balances: mapped.balances,
    forecasting: mapped.forecasting,
    policy: mapped.policy,
    reserves: mapped.reserves,
    escalations: mapped.escalations,
    invoices: mapped.invoices,
    audit: mapped.audit,
    slabs: mapped.slabs,
    sanctionsVerdict: mapped.sanctionsVerdict,
    liveHarvestYield: mapped.liveHarvestYield,
    blockHeight: mapped.blockHeight,

    // Status flags
    isLiveBackend: mapped.isLiveBackend,
    isRefreshing: mapped.isRefreshing,
    actionState: mapped.actionState,

    // Telemetry provenance metadata
    telemetry: mapped.telemetry,

    // Dispatch methods
    refreshAll,
    fetchSummary,
    fetchReserves,
    fetchEscalations,
    fetchAuditLedger,
    checkSanctions,
    processInvoice,
    approveEscalation,
    cancelEscalation,
    sweepSurplusYield,
    redeemYield,
    resetEscalationDemo,
  }), [
    mapped,
    refreshAll,
    fetchSummary,
    fetchReserves,
    fetchEscalations,
    fetchAuditLedger,
    checkSanctions,
    processInvoice,
    approveEscalation,
    cancelEscalation,
    sweepSurplusYield,
    redeemYield,
    resetEscalationDemo,
  ]);
}
