import React from 'react';
import { useSakellariousEngine } from './core/useSakellariousEngine';
import { SmoothScroll } from './core/SmoothScroll';
import { CaliperCursor } from './components/CaliperCursor';
import { CockpitHeader } from './components/CockpitHeader';
import { Viewport01Hero } from './components/Viewport01Hero';
import { Viewport02Thesis } from './components/Viewport02Thesis';
import { Viewport03Treasury } from './components/Viewport03Treasury';
import { Viewport04Escalation } from './components/Viewport04Escalation';
import { Viewport05Ledger } from './components/Viewport05Ledger';

export const App: React.FC = () => {
  const engine = useSakellariousEngine();

  return (
    <SmoothScroll>
      {/* 1. Custom Precision Caliper Cursor (Primary Reticle + Trailing Lerp 0.18 Frame) */}
      <CaliperCursor />

      {/* 2. Persistent 56px Cockpit Instrument Header */}
      <CockpitHeader engine={engine} />

      {/* 3. Global Kinetic Chassis Container */}
      <main style={{ width: '100%', position: 'relative' }}>
        {/* VIEWPORT 01: Sovereign Governor Hero (Obsidian Void + WebGL Optical Governor) */}
        <Viewport01Hero engine={engine} />

        {/* VIEWPORT 02: Bounded Authority Thesis & 44px Kinetic Telemetry Band */}
        <Viewport02Thesis />

        {/* VIEWPORT 03: Live Treasury Matrix & USYC Equilibrium */}
        <Viewport03Treasury engine={engine} />

        {/* VIEWPORT 04: The Governance Datum Collision & Human Escalation Chamber */}
        <Viewport04Escalation engine={engine} />

        {/* VIEWPORT 05: Registered Euthyna Archive (Beancount + JSON-LD) */}
        <Viewport05Ledger engine={engine} />

        {/* CHASSIS LOWER CORRIDOR / STATUS FOOTER */}
        <footer
          id="viewport-chassis-footer"
          data-chamber="void"
          style={{
            width: '100%',
            backgroundColor: 'var(--void-bg)',
            padding: '40px 32px',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none'
          }}
        >
          <div
            data-datum="true"
            data-telemetry="FOOTER // ARC L1 CONTINUOUS CHANCERY"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: 'var(--void-text-muted)'
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--signal-amber)'
              }}
            />
            <span>SAKELLARIOUS // PHASE 1 CHASSIS ACTIVE</span>
            <span>//</span>
            <span>CHAIN ID: 42111 (ARC L1)</span>
          </div>

          <div
            data-datum="true"
            data-telemetry="LEDGER RECORD // EUTHYNA RECEIPT #00481"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.16em',
              color: 'var(--void-text-muted)'
            }}
          >
            EUTHYNA LEDGER RECORD: #00481 // GASLESS PAYMASTER SETTLEMENT
          </div>
        </footer>
      </main>
    </SmoothScroll>
  );
};

export default App;
