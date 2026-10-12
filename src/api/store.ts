/**
 * Shared Reactive Polling Store for Treasury Telemetry
 * Reference: docs/integration/CONTRACT.md, SIDE_EFFECTS.md & DECISIONS.md
 * Constraints:
 * - D3: USE_LIVE_DATA defaults to false
 * - One shared store singleton
 * - One in-flight request per route at any time
 * - Polling interval >= 15s (30s for RPC-hitting routes like /summary)
 * - Automatic pause when document tab is hidden
 * - Exponential backoff on route error
 */

import {
  type SlabViewModel,
  type TreasurySummaryViewModel,
  type GatewayChainViewModel,
  type EscalationViewModel,
  type ApiCatalogDto,
} from './types';
import {
  fetchApiCatalog,
  fetchTreasurySummary,
  fetchGatewayReserves,
  fetchReceipts,
  fetchEscalations,
  fetchBeancountLedger,
} from './client';
import {
  adaptReceiptsToSlabs,
  adaptTreasurySummary,
  adaptGatewayReserves,
  adaptEscalations,
} from './adapters';

export { USE_LIVE_DATA } from './client';

export interface TreasuryStoreState {
  summary: TreasurySummaryViewModel | null;
  reserves: GatewayChainViewModel[];
  slabs: SlabViewModel[];
  escalations: EscalationViewModel[];
  beancountRaw: string | null;
  catalog: ApiCatalogDto | null;
  loading: {
    summary: boolean;
    reserves: boolean;
    slabs: boolean;
    escalations: boolean;
    beancount: boolean;
  };
  errors: {
    summary: Error | null;
    reserves: Error | null;
    slabs: Error | null;
    escalations: Error | null;
    beancount: Error | null;
  };
  lastUpdated: {
    summary: number | null;
    reserves: number | null;
    slabs: number | null;
    escalations: number | null;
    beancount: number | null;
  };
}

type Listener = (state: TreasuryStoreState) => void;

class TreasuryStore {
  private state: TreasuryStoreState = {
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
  };

  private listeners = new Set<Listener>();
  private inFlight = new Set<string>();
  private failureCounts = new Map<string, number>();
  private timers = new Map<string, NodeJS.Timeout | number>();
  private isPollingActive = false;

  // Base intervals (RPC routes 30s; disk/memory routes 15s)
  private readonly INTERVALS = {
    summary: 30_000, // Hits RPC (syncOnChainState)
    reserves: 30_000,
    slabs: 15_000, // Reads ledger/receipts.json
    escalations: 15_000,
    beancount: 60_000,
  };

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.pausePolling();
        } else if (this.isPollingActive) {
          this.resumePolling();
        }
      });
    }
  }

  public getState(): TreasuryStoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // ==========================================================================
  // Single In-Flight Route Fetchers
  // ==========================================================================

  public async refreshSummary(): Promise<void> {
    const routeKey = 'summary';
    if (this.inFlight.has(routeKey)) return;
    this.inFlight.add(routeKey);
    this.state.loading.summary = true;
    this.notify();

    try {
      if (!this.state.catalog) {
        try {
          this.state.catalog = await fetchApiCatalog();
        } catch {
          // Non-fatal if catalog discovery fails
        }
      }

      const dto = await fetchTreasurySummary();
      const adapted = adaptTreasurySummary(dto, this.state.catalog);
      if (!adapted) {
        throw new Error('Invalid treasury summary payload structure');
      }
      this.state.summary = adapted;
      this.state.errors.summary = null;
      this.state.lastUpdated.summary = Date.now();
      this.failureCounts.set(routeKey, 0);
    } catch (err) {
      this.state.errors.summary = err instanceof Error ? err : new Error(String(err));
      const fails = (this.failureCounts.get(routeKey) || 0) + 1;
      this.failureCounts.set(routeKey, fails);
    } finally {
      this.state.loading.summary = false;
      this.inFlight.delete(routeKey);
      this.notify();
    }
  }

  public async refreshReserves(): Promise<void> {
    const routeKey = 'reserves';
    if (this.inFlight.has(routeKey)) return;
    this.inFlight.add(routeKey);
    this.state.loading.reserves = true;
    this.notify();

    try {
      const dto = await fetchGatewayReserves();
      this.state.reserves = adaptGatewayReserves(dto);
      this.state.errors.reserves = null;
      this.state.lastUpdated.reserves = Date.now();
      this.failureCounts.set(routeKey, 0);
    } catch (err) {
      this.state.errors.reserves = err instanceof Error ? err : new Error(String(err));
      const fails = (this.failureCounts.get(routeKey) || 0) + 1;
      this.failureCounts.set(routeKey, fails);
    } finally {
      this.state.loading.reserves = false;
      this.inFlight.delete(routeKey);
      this.notify();
    }
  }

  public async refreshSlabs(): Promise<void> {
    const routeKey = 'slabs';
    if (this.inFlight.has(routeKey)) return;
    this.inFlight.add(routeKey);
    this.state.loading.slabs = true;
    this.notify();

    try {
      const dto = await fetchReceipts();
      this.state.slabs = adaptReceiptsToSlabs(dto);
      this.state.errors.slabs = null;
      this.state.lastUpdated.slabs = Date.now();
      this.failureCounts.set(routeKey, 0);
    } catch (err) {
      this.state.errors.slabs = err instanceof Error ? err : new Error(String(err));
      const fails = (this.failureCounts.get(routeKey) || 0) + 1;
      this.failureCounts.set(routeKey, fails);
    } finally {
      this.state.loading.slabs = false;
      this.inFlight.delete(routeKey);
      this.notify();
    }
  }

  public async refreshEscalations(): Promise<void> {
    const routeKey = 'escalations';
    if (this.inFlight.has(routeKey)) return;
    this.inFlight.add(routeKey);
    this.state.loading.escalations = true;
    this.notify();

    try {
      const dto = await fetchEscalations();
      this.state.escalations = adaptEscalations(dto);
      this.state.errors.escalations = null;
      this.state.lastUpdated.escalations = Date.now();
      this.failureCounts.set(routeKey, 0);
    } catch (err) {
      this.state.errors.escalations = err instanceof Error ? err : new Error(String(err));
      const fails = (this.failureCounts.get(routeKey) || 0) + 1;
      this.failureCounts.set(routeKey, fails);
    } finally {
      this.state.loading.escalations = false;
      this.inFlight.delete(routeKey);
      this.notify();
    }
  }

  public async refreshBeancount(): Promise<void> {
    const routeKey = 'beancount';
    if (this.inFlight.has(routeKey)) return;
    this.inFlight.add(routeKey);
    this.state.loading.beancount = true;
    this.notify();

    try {
      this.state.beancountRaw = await fetchBeancountLedger();
      this.state.errors.beancount = null;
      this.state.lastUpdated.beancount = Date.now();
      this.failureCounts.set(routeKey, 0);
    } catch (err) {
      this.state.errors.beancount = err instanceof Error ? err : new Error(String(err));
      const fails = (this.failureCounts.get(routeKey) || 0) + 1;
      this.failureCounts.set(routeKey, fails);
    } finally {
      this.state.loading.beancount = false;
      this.inFlight.delete(routeKey);
      this.notify();
    }
  }

  // ==========================================================================
  // Polling Scheduler with Exponential Backoff & Tab Visibility
  // ==========================================================================

  public startPolling(): void {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    this.resumePolling();
  }

  public stopPolling(): void {
    this.isPollingActive = false;
    this.pausePolling();
  }

  private pausePolling(): void {
    for (const [key, timer] of this.timers) {
      clearTimeout(timer as unknown as NodeJS.Timeout);
      this.timers.delete(key);
    }
  }

  private resumePolling(): void {
    this.scheduleRoute('summary', () => this.refreshSummary(), this.INTERVALS.summary);
    this.scheduleRoute('reserves', () => this.refreshReserves(), this.INTERVALS.reserves);
    this.scheduleRoute('slabs', () => this.refreshSlabs(), this.INTERVALS.slabs);
    this.scheduleRoute('escalations', () => this.refreshEscalations(), this.INTERVALS.escalations);
  }

  private scheduleRoute(routeKey: string, action: () => Promise<void>, baseInterval: number): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    const fails = this.failureCounts.get(routeKey) || 0;
    const backoffMultiplier = Math.min(Math.pow(2, fails), 8);
    const effectiveInterval = baseInterval * backoffMultiplier;

    const timer = setTimeout(async () => {
      await action();
      if (this.isPollingActive) {
        this.scheduleRoute(routeKey, action, baseInterval);
      }
    }, effectiveInterval);

    this.timers.set(routeKey, timer);
  }
}

export const treasuryStore = new TreasuryStore();
