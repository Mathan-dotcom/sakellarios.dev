/**
 * Headless Engine Dispatcher Wrapper
 * Architecture: src/core/useSakellariousEngine.ts
 * 
 * Re-exports contract types and dispatches to the legacy or live engine.
 * For C2: Always returns legacy hook (flag ignored).
 */

import { useLegacySakellariousEngine } from './useLegacySakellariousEngine';

export function useSakellariousEngine() {
  return useLegacySakellariousEngine();
}

export * from './useLegacySakellariousEngine';
