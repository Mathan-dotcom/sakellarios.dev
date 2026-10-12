/**
 * Headless Engine Dispatcher Wrapper
 * Architecture: src/core/useSakellariousEngine.ts
 * 
 * Re-exports contract types and dispatches to the legacy or live engine
 * via the USE_LIVE_DATA feature flag.
 * - When USE_LIVE_DATA is false: returns the legacy deterministic mock engine.
 * - When USE_LIVE_DATA is true: returns the live reactive engine bridge.
 */

import { USE_LIVE_DATA } from '../api/store';
import { useLegacySakellariousEngine } from './useLegacySakellariousEngine';
import { useLiveSakellariousEngine } from './useLiveSakellariousEngine';

export function useSakellariousEngine() {
  if (USE_LIVE_DATA) {
    return useLiveSakellariousEngine();
  }
  return useLegacySakellariousEngine();
}

export * from './useLegacySakellariousEngine';
export * from './liveAdapters';
