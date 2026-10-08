import React, { useState, useEffect, useRef } from 'react';
import { useSakellariousEngine } from '../core/useSakellariousEngine';

export interface Viewport03TreasuryProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

export const Viewport03Treasury: React.FC<Viewport03TreasuryProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);

  // Custom obligation form state
  const [customVendor, setCustomVendor] = useState('0x4444444444444444444444444444444444444444');
  const [customAmount, setCustomAmount] = useState('180');
  const [customCategory, setCustomCategory] = useState('SAAS');
  const [customInvoiceRef, setCustomInvoiceRef] = useState('INV-CUSTOM-012');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // ARTIFACT II: HTML5 CANVAS LIQUIDITY EQUILIBRIUM CONTOUR
  // 24 precision horizontal contour wave lines that physically compress when swept
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.025;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(20, 20, 19, 0.05)';
      ctx.lineWidth = 1;
      const stepX = 40;
      for (let x = 0; x < width; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Compression factor: how close liquid buffer is to 400k floor
      const surplus = Math.max(0, engine.balances.arcLiquidUsdc - engine.forecasting.targetBuffer30D);
      const compression = Math.min(1, surplus / 50000); // 0 (compressed) to 1 (expanded)

      const lineCount = 24;
      const spacing = height / (lineCount + 1);

      for (let i = 0; i < lineCount; i++) {
        const baseY = (i + 1) * spacing;
        const lineRatio = i / lineCount;
        const amplitude = (6 + 8 * (1 - Math.abs(lineRatio - 0.5) * 2)) * (0.4 + 0.6 * compression);
        const frequency = 0.012 + i * 0.0006;

        ctx.beginPath();
        const isFloorLine = i === 12; // Nominal 400k Floor Datum
        if (isFloorLine) {
          ctx.strokeStyle = 'rgba(200, 75, 49, 0.85)'; // Tension / Datum line
          ctx.lineWidth = 1.5;
        } else if (i % 4 === 0) {
          ctx.strokeStyle = 'rgba(212, 148, 58, 0.7)'; // Amber primary
          ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = 'rgba(20, 20, 19, 0.22)'; // Hairline contours
          ctx.lineWidth = 0.8;
        }

        for (let x = 0; x < width; x += 4) {
          const wave = Math.sin(x * frequency + time + i * 0.28) * amplitude;
          const y = baseY + wave;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Live Telemetry Crosshair when hovered
      if (cursorPos && isCanvasHovered) {
        const { x, y } = cursorPos;
        // Vertical Datum Hairline
        ctx.strokeStyle = 'rgba(20, 20, 19, 0.75)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair point
        ctx.fillStyle = '#C84B31';
        ctx.fillRect(x - 2, y - 2, 5, 5);

        // Hover Tag Box
        const tagX = Math.min(width - 240, Math.max(10, x + 12));
        const tagY = Math.min(height - 40, Math.max(20, y - 16));

        ctx.fillStyle = '#141413';
        ctx.fillRect(tagX, tagY, 230, 32);

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#F2EFE9';
        ctx.fillText('SWEEP EPOCH #00480 // USYC APY: 5.12%', tagX + 8, tagY + 13);
        ctx.fillStyle = 'rgba(242, 239, 233, 0.65)';
        ctx.fillText('CIRCLE GATEWAY TX: 0x7e8c...a88', tagX + 8, tagY + 25);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cursorPos, isCanvasHovered, engine.balances.arcLiquidUsdc, engine.forecasting.targetBuffer30D]);

  // Handlers for tactical controls
  const handleSweep = async () => {
    const res = await engine.sweepSurplusYield();
    setSubmissionFeedback(
      res.swept
        ? `SUCCESS: $${res.amount.toFixed(2)} USDC swept into USYC via Circle Gateway.`
        : 'BUFFER BALANCED: Liquid reserves within 400,000 floor. Zero sweep needed.'
    );
  };

  const handleRedeem = async () => {
    const res = await engine.redeemYield(20000);
    setSubmissionFeedback(
      res.success
        ? `SUCCESS: Redeemed $${res.amountRedeemed.toFixed(2)} USYC -> Liquid Buffer.`
        : 'Redemption request completed.'
    );
  };

  // Handlers for invoice triggers
  const handleInjectCompliant = async () => {
    setSubmissionFeedback('Dispatching 120.00 USDC compliant invoice to Circle Paymaster...');
    const res = await engine.processInvoice({
      vendorAddress: '0x3333333333333333333333333333333333333333',
      amountUsdc: 120.00,
      category: 'INFRASTRUCTURE',
      invoiceRef: `INV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      reasoning: 'Hetzner Kubernetes bare-metal RPC node cluster'
    });
    setSubmissionFeedback(`STATUS: ${res.status} // ${res.message}`);
  };

  const handleInjectBreach = async () => {
    setSubmissionFeedback('Dispatching 500.00 USDC invoice (exceeds $250 cap)...');
    const res = await engine.processInvoice({
      vendorAddress: '0x6666666666666666666666666666666666666666',
      amountUsdc: 500.00,
      category: 'VENDOR',
      invoiceRef: `INV-BREACH-${Math.floor(1000 + Math.random() * 9000)}`,
      reasoning: 'Enterprise SOC2 penetration test retainer'
    });
    setSubmissionFeedback(`STATUS: ${res.status} // ${res.message}`);
  };

  const handleTestSanctioned = async () => {
    setSubmissionFeedback('Evaluating address against OpenSanctions OFAC database...');
    const verdict = await engine.checkSanctions('0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c');
    setSubmissionFeedback(
      `SANCTIONS CHECK: ${verdict.status} // ${verdict.entityName} (HALTED ON-CHAIN)`
    );
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(customAmount);
    if (isNaN(amt) || amt <= 0) return;

    setSubmissionFeedback(`Dispatching ${amt.toFixed(2)} USDC obligation to policy wallet...`);
    const res = await engine.processInvoice({
      vendorAddress: customVendor,
      amountUsdc: amt,
      category: customCategory,
      invoiceRef: customInvoiceRef,
      reasoning: 'Custom Obligation Injection via Operator Console'
    });
    setSubmissionFeedback(`RESULT: ${res.status} // ${res.message}`);
  };

  return (
    <section
      id="viewport-03-treasury"
      data-chamber="mineral"
      style={{
        width: '100%',
        backgroundColor: 'var(--mineral-bg)',
        color: 'var(--mineral-ink)',
        borderBottom: '1px solid var(--mineral-hairline)',
        boxSizing: 'border-box'
      }}
    >
      {/* SECTION TOP SUB-BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          borderBottom: '1px solid var(--mineral-hairline)',
          backgroundColor: 'var(--mineral-recess)',
          userSelect: 'none'
        }}
      >
        <div
          data-datum="true"
          data-telemetry="VIEWPORT 03 // LIVE TREASURY MATRIX"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>■</span>
          <span>VIEWPORT 03 // LIVE TREASURY MATRIX &amp; USYC EQUILIBRIUM</span>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'var(--mineral-ink-muted)'
          }}
        >
          CHAMBER II: MINERAL ARCHIVE // REVERSIBILITY THRESHOLD
        </div>
      </div>

      {/* CONTINUOUS 50% / 50% ARCHITECTURAL SPLIT (ALIGNING TO AXIS X:00 CENTRAL DATUM SPINE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '50% 50%',
          minHeight: '840px'
        }}
      >
        {/* ====================================================================
            LEFT COLUMN (50%): LIQUIDITY VS BUFFER & ARTIFACT II CONTOUR WAVE
            ==================================================================== */}
        <div
          style={{
            borderRight: '1px solid var(--mineral-hairline)',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div>
            {/* Header Telemetry */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: 'var(--mineral-ink-muted)',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}
            >
              01 // ACTIVE LIQUID BUFFER VS MANDATORY FLOOR
            </div>

            {/* Monumental Syne Numerals with Extreme Scale Contrast */}
            <div
              data-metric="true"
              data-telemetry="LIQUID BUFFER // 420,000.00 USDC"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                marginBottom: '12px'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(3.25rem, 5.5vw, 6rem)',
                  fontWeight: 700,
                  lineHeight: 0.92,
                  letterSpacing: '-0.04em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--mineral-ink)'
                }}
              >
                ${engine.balances.arcLiquidUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  color: 'var(--mineral-ink-muted)'
                }}
              >
                USDC [LIQUID]
              </div>
            </div>

            {/* Caliper Mark & Operating Floor Spec */}
            <div
              data-datum="true"
              data-telemetry="MANDATORY FLOOR // 400,000.00 USDC"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                backgroundColor: 'var(--mineral-recess)',
                border: '1px solid var(--mineral-hairline)',
                marginBottom: '28px'
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#C84B31'
                }}
              />
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  color: 'var(--mineral-ink)'
                }}
              >
                <strong>400,000.00 USDC</strong> (30D MANDATORY OPERATING FLOOR — LOCKED)
              </div>
              <span style={{ color: 'var(--mineral-ink-muted)' }}>//</span>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--mineral-ink-muted)'
                }}
              >
                SURPLUS: ${Math.max(0, engine.balances.arcLiquidUsdc - engine.forecasting.targetBuffer30D).toLocaleString()} USDC
              </div>
            </div>

            {/* Secondary Dual Metrics: USYC Vault + Forecast Uncertainty Band */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '28px'
              }}
            >
              <div
                data-metric="true"
                data-telemetry="USYC RESERVE // 1,000,000.00 USYC (5.12% APY)"
                style={{
                  padding: '16px',
                  border: '1px solid var(--mineral-hairline)',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--mineral-ink-muted)', letterSpacing: '0.12em' }}>
                  YIELD-BEARING RESERVE
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, marginTop: '4px' }}>
                  ${engine.balances.arcUsycVault.toLocaleString()} USYC
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--signal-amber)', marginTop: '4px' }}>
                  5.12% APY // CIRCLE GATEWAY
                </div>
              </div>

              <div
                data-metric="true"
                data-telemetry="7D UNCERTAINTY BAND // 68,400 ± 4,200 USDC"
                style={{
                  padding: '16px',
                  border: '1px solid var(--mineral-hairline)',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--mineral-ink-muted)', letterSpacing: '0.12em' }}>
                  7D FORECAST OBLIGATIONS
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, marginTop: '4px' }}>
                  68,400 USDC
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mineral-ink-muted)', marginTop: '4px' }}>
                  UNCERTAINTY BAND: ± 4,200 USDC
                </div>
              </div>
            </div>

            {/* ARTIFACT II: Canvas Liquidity Equilibrium Contour */}
            <div
              style={{
                border: '1px solid var(--mineral-hairline)',
                backgroundColor: 'white',
                marginBottom: '28px',
                position: 'relative'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--mineral-hairline)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.14em',
                  color: 'var(--mineral-ink-muted)',
                  backgroundColor: 'var(--mineral-recess)'
                }}
              >
                <span>ARTIFACT II // ORTHOGRAPHIC LIQUIDITY EQUILIBRIUM CONTOUR</span>
                <span>24 HARMONIC CONTOURS</span>
              </div>
              <canvas
                ref={canvasRef}
                width={640}
                height={220}
                onMouseEnter={() => setIsCanvasHovered(true)}
                onMouseLeave={() => {
                  setIsCanvasHovered(false);
                  setCursorPos(null);
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCursorPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  });
                }}
                style={{
                  width: '100%',
                  height: '220px',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {/* TWO FLUSH-BORDERED TACTICAL CONTROLS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}
          >
            <button
              onClick={handleSweep}
              data-datum="true"
              data-telemetry="ACTION // SWEEP SURPLUS USDC -> USYC"
              className="tactical-button"
              style={{
                padding: '16px 20px',
                backgroundColor: 'var(--mineral-bg)',
                color: 'var(--mineral-ink)',
                border: '1px solid var(--mineral-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                transition: 'background-color 180ms var(--ease-mechanical), color 180ms var(--ease-mechanical)'
              }}
            >
              [ SWEEP SURPLUS USDC -&gt; USYC ]
            </button>

            <button
              onClick={handleRedeem}
              data-datum="true"
              data-telemetry="ACTION // REDEEM USYC -> LIQUID BUFFER"
              className="tactical-button"
              style={{
                padding: '16px 20px',
                backgroundColor: 'var(--mineral-bg)',
                color: 'var(--mineral-ink)',
                border: '1px solid var(--mineral-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                transition: 'background-color 180ms var(--ease-mechanical), color 180ms var(--ease-mechanical)'
              }}
            >
              [ REDEEM USYC -&gt; LIQUID BUFFER ]
            </button>
          </div>
        </div>

        {/* ====================================================================
            RIGHT COLUMN (42%): POLICYWALLET RULE BAYS & LIVE OBLIGATION INJECTOR
            ==================================================================== */}
        <div
          style={{
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.16em',
                color: 'var(--mineral-ink-muted)',
                marginBottom: '16px',
                textTransform: 'uppercase'
              }}
            >
              02 // POLICYWALLET MATHEMATICAL GUARDRAILS (4 BAYS)
            </div>

            {/* 4 CONTIGUOUS 1PX-BORDERED ARCHITECTURAL RULE BAYS */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--mineral-hairline)',
                marginBottom: '28px'
              }}
            >
              {/* BAY POL-01 */}
              <div
                className="rule-bay"
                data-datum="true"
                data-telemetry="RULE POL-01 // BUFFER FLOOR >= 400K"
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--mineral-hairline)',
                  transition: 'background-color 180ms var(--ease-mechanical), color 180ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-01: 30D OPERATING BUFFER &gt;= 400,000 USDC
                  </span>
                  <span className="rule-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--signal-verified)' }}>
                    [ENFORCED]
                  </span>
                </div>
                <div className="rule-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mineral-ink-muted)', marginTop: '4px' }}>
                  Active Buffer: ${engine.balances.arcLiquidUsdc.toLocaleString()} USDC // Lock: Strict
                </div>
              </div>

              {/* BAY POL-02 */}
              <div
                className="rule-bay"
                data-datum="true"
                data-telemetry="RULE POL-02 // SINGLE-TX CAP <= 250 USDC"
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--mineral-hairline)',
                  transition: 'background-color 180ms var(--ease-mechanical), color 180ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-02: AUTONOMOUS SINGLE-TX CAP &lt;= 250.00 USDC
                  </span>
                  <span className="rule-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--signal-verified)' }}>
                    [ENFORCED]
                  </span>
                </div>
                <div className="rule-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mineral-ink-muted)', marginTop: '4px' }}>
                  Transactions &gt; 250 USDC physically halt at the Governance Datum for human seal.
                </div>
              </div>

              {/* BAY POL-03 */}
              <div
                className="rule-bay"
                data-datum="true"
                data-telemetry="RULE POL-03 // OPENSANCTIONS SCORE == 0.00"
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--mineral-hairline)',
                  transition: 'background-color 180ms var(--ease-mechanical), color 180ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-03: OPENSANCTIONS SCREENING SCORE == 0.00
                  </span>
                  <span className="rule-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--signal-verified)' }}>
                    [ENFORCED]
                  </span>
                </div>
                <div className="rule-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mineral-ink-muted)', marginTop: '4px' }}>
                  Counterparty checked against OFAC / EU SDN databases prior to wallet dispatch.
                </div>
              </div>

              {/* BAY POL-04 */}
              <div
                className="rule-bay"
                data-datum="true"
                data-telemetry="RULE POL-04 // CIRCLE PAYMASTER GASLESS"
                style={{
                  padding: '14px 18px',
                  transition: 'background-color 180ms var(--ease-mechanical), color 180ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-04: CIRCLE PAYMASTER GASLESS SPONSORSHIP
                  </span>
                  <span className="rule-badge" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--signal-verified)' }}>
                    [ENFORCED]
                  </span>
                </div>
                <div className="rule-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mineral-ink-muted)', marginTop: '4px' }}>
                  Gasless relay of valid ERC-4337 UserOperations. Zero ETH / native gas required.
                </div>
              </div>
            </div>

            {/* RECESSED #0A0A09 LIVE OBLIGATION INJECTOR */}
            <div
              style={{
                backgroundColor: 'var(--void-bg)',
                color: 'var(--void-text-primary)',
                border: '1px solid var(--void-hairline)',
                padding: '24px'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  color: 'var(--signal-amber)',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>// LIVE OBLIGATION INJECTOR</span>
                <span style={{ color: 'var(--void-text-muted)' }}>ARC L1 ENGINE</span>
              </div>

              {/* Instant Test Triggers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={handleInjectCompliant}
                  className="injector-trigger"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--void-surface)',
                    color: 'var(--signal-verified)',
                    border: '1px solid rgba(46, 90, 68, 0.4)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textAlign: 'left'
                  }}
                >
                  [ INJECT 120 USDC COMPLIANT INVOICE ] -&gt; AUTO SETTLE
                </button>

                <button
                  type="button"
                  onClick={handleInjectBreach}
                  className="injector-trigger"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--void-surface)',
                    color: 'var(--signal-tension)',
                    border: '1px solid rgba(200, 75, 49, 0.4)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textAlign: 'left'
                  }}
                >
                  [ INJECT 500 USDC BOUND-BREACH INVOICE ] -&gt; HALT AT DATUM
                </button>

                <button
                  type="button"
                  onClick={handleTestSanctioned}
                  className="injector-trigger"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--void-surface)',
                    color: '#9E2A2B',
                    border: '1px solid rgba(158, 42, 43, 0.4)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    textAlign: 'left'
                  }}
                >
                  [ TEST SANCTIONED ENTITY BLOCK ] -&gt; OFAC VIOLATION
                </button>
              </div>

              {/* Custom Input Form */}
              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--void-text-muted)', marginBottom: '2px' }}>
                      VENDOR ADDRESS
                    </label>
                    <input
                      type="text"
                      value={customVendor}
                      onChange={(e) => setCustomVendor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: 'var(--void-surface)',
                        color: 'var(--void-text-primary)',
                        border: '1px solid var(--void-hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--void-text-muted)', marginBottom: '2px' }}>
                      AMOUNT (USDC)
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: 'var(--void-surface)',
                        color: 'var(--void-text-primary)',
                        border: '1px solid var(--void-hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--void-text-muted)', marginBottom: '2px' }}>
                      CATEGORY
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: 'var(--void-surface)',
                        color: 'var(--void-text-primary)',
                        border: '1px solid var(--void-hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--void-text-muted)', marginBottom: '2px' }}>
                      INVOICE REF
                    </label>
                    <input
                      type="text"
                      value={customInvoiceRef}
                      onChange={(e) => setCustomInvoiceRef(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: 'var(--void-surface)',
                        color: 'var(--void-text-primary)',
                        border: '1px solid var(--void-hairline)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--void-text-primary)',
                    color: 'var(--void-bg)',
                    border: '1px solid var(--void-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginTop: '4px',
                    cursor: 'pointer'
                  }}
                >
                  DISPATCH TO POLICY ENGINE
                </button>
              </form>

              {/* Dynamic Action Feedback */}
              {submissionFeedback && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 10px',
                    backgroundColor: '#121210',
                    border: '1px solid var(--void-hairline)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--signal-amber)',
                    lineHeight: 1.4
                  }}
                >
                  {submissionFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
