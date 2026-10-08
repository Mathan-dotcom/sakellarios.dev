import { useState, useEffect, useRef } from 'react';

/**
 * useAnimatedNumber
 * Critically Damped Mechanical Numerical Interpolation Hook (Odometer Physics)
 * Easing: 1 - Math.pow(1 - t, 4) (Quartic Out / Critically Damped Mechanical Settle)
 */
export function useAnimatedNumber(targetValue: number, duration = 420): number {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);
  const targetRef = useRef(targetValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === targetRef.current && currentValue === targetValue) {
      return;
    }

    startValueRef.current = currentValue;
    targetRef.current = targetValue;
    startTimeRef.current = performance.now();

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
  }, [targetValue, duration]);

  return currentValue;
}
