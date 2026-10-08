import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface LenisContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number) => void;
}

export const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {}
});

export const useLenis = () => useContext(LenisContext);

export interface SmoothScrollProps {
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis smooth inertial scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5
    });

    lenisRef.current = lenis;

    // Couple Lenis scroll notifications directly to GSAP ScrollTrigger updates
    lenis.on('scroll', ScrollTrigger.update);

    // Couple Lenis step into GSAP ticker
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = (target: string | HTMLElement | number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -56, duration: 1.2 });
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      <div className="global-chassis">
        {children}
      </div>
    </LenisContext.Provider>
  );
};
