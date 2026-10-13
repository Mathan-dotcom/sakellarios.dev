import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

/**
 * useAnimatedNumber
 * Critically Damped Mechanical Numerical Interpolation Hook (Odometer Physics)
 * Easing: 1 - Math.pow(1 - t, 4) (Quartic Out / Critically Damped Mechanical Settle)
 */
export function useAnimatedNumber(targetValue: number, duration = 420, initialValue?: number): number {
  const [currentValue, setCurrentValue] = useState(initialValue !== undefined ? initialValue : targetValue);
  const startValueRef = useRef(initialValue !== undefined ? initialValue : targetValue);
  const startTimeRef = useRef<number | null>(null);
  const targetRef = useRef(initialValue !== undefined ? initialValue : targetValue);
  const rafRef = useRef<number | null>(null);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (initialValue !== undefined && initialValue !== targetValue) {
        startValueRef.current = initialValue;
        targetRef.current = targetValue;
        startTimeRef.current = performance.now();
      } else {
        return;
      }
    } else {
      if (targetValue === targetRef.current && currentValue === targetValue) {
        return;
      }
      startValueRef.current = currentValue;
      targetRef.current = targetValue;
      startTimeRef.current = performance.now();
    }

    const animate = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);

      // Critically damped mechanical easing: 1 - (1 - t)^4
      const ease = 1 - Math.pow(1 - progress, 4);
      const nextVal = startValueRef.current + (targetRef.current - startValueRef.current) * ease;
      setCurrentValue(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetRef.current);
      }
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration, initialValue]);

  return currentValue;
}

// ============================================================================
// CRYPTOGRAPHIC CIPHER DECODE TRANSITIONS
// Rapidly cycles through hex characters 0-9, A-F before locking into the target text
// ============================================================================

const HEX_CHARS = '0123456789ABCDEF';

/**
 * scrambleText
 * Animate text through a cryptographic scramble over duration (ms),
 * cycling through hex characters before settling left-to-right.
 */
export function scrambleText(
  onUpdate: (scrambled: string) => void,
  finalText: string,
  duration = 250,
  onComplete?: () => void
): () => void {
  const startTime = performance.now();
  let rafId: number;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);

    if (progress >= 1) {
      onUpdate(finalText);
      if (onComplete) onComplete();
      return;
    }

    const len = finalText.length;
    const resolvedCount = Math.floor(progress * len);
    let out = '';

    for (let i = 0; i < len; i++) {
      if (i < resolvedCount) {
        out += finalText[i];
      } else if (
        finalText[i] === ' ' ||
        finalText[i] === '[' ||
        finalText[i] === ']' ||
        finalText[i] === '/' ||
        finalText[i] === ':' ||
        finalText[i] === '-'
      ) {
        out += finalText[i];
      } else {
        out += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)];
      }
    }

    onUpdate(out);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

/**
 * useCipherScramble
 * Declarative hook for scrambled text transitions
 */
export function useCipherScramble(targetText: string, duration = 250): string {
  const [displayText, setDisplayText] = useState(targetText);
  const targetRef = useRef(targetText);

  useEffect(() => {
    if (targetText === targetRef.current) return;
    targetRef.current = targetText;

    const cancel = scrambleText(
      (text) => setDisplayText(text),
      targetText,
      duration
    );

    return cancel;
  }, [targetText, duration]);

  return displayText;
}
