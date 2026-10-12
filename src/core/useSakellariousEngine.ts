/**
 * Headless Engine Dispatcher Wrapper
 * Architecture: src/core/useSakellariousEngine.ts
 * 
 * Re-exports contract types and dispatches to the legacy or live engine
 * via the USE_LIVE_DATA feature flag.
 * - When USE_LIVE_DATA is false: returns the legacy deterministic mock engine.
 * - When USE_LIVE_DATA is true: returns the live reactive engine bridge.
 */

import { useLegacySakellariousEngine } from './useLegacySakellariousEngine';
import { useLiveSakellariousEngine } from './useLiveSakellariousEngine';

export function useSakellariousEngine(): ReturnType<typeof useLiveSakellariousEngine> {
  if (import.meta.env.VITE_USE_LIVE_DATA === 'true') {
    return useLiveSakellariousEngine();
  }
  return useLegacySakellariousEngine() as unknown as ReturnType<typeof useLiveSakellariousEngine>;
}

export * from './useLegacySakellariousEngine';
export * from './liveAdapters';
