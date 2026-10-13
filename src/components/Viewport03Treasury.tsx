import React, { useState, useEffect, useRef } from 'react';
import { useSakellariousEngine } from '../core/useSakellariousEngine';
import { useAnimatedNumber, scrambleText } from '../core/useAnimatedNumber';
import { useLenis } from '../core/SmoothScroll';

export interface Viewport03TreasuryProps {
  engine: ReturnType<typeof useSakellariousEngine>;
}

type BayStatus = 'idle' | 'checking' | 'passed' | 'breached';

export const Viewport03Treasury: React.FC<Viewport03TreasuryProps> = React.memo(({ engine }) => {
  const { lenis, scrollTo } = useLenis();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const isCanvasHoveredRef = useRef(false);

  const animLiquid = useAnimatedNumber(engine.balances.arcLiquidUsdc);
  const animUsyc = useAnimatedNumber(engine.balances.arcUsycVault);

  // PolicyWallet 4-stage sequential evaluation state
  const [bayLabels, setBayLabels] = useState<[string, string, string, string]>([
    '[ENFORCED]',
    '[ENFORCED]',
    '[ENFORCED]',
    '[ENFORCED]'
  ]);
  const [evalState, setEvalState] = useState<{
    isEvaluating: boolean;
    activeBay: number;
    bayStatuses: [BayStatus, BayStatus, BayStatus, BayStatus];
    bannerText: string | null;
    bannerType: 'idle' | 'checking' | 'cleared' | 'breached';
  }>({
    isEvaluating: false,
    activeBay: -1,
    bayStatuses: ['idle', 'idle', 'idle', 'idle'],
    bannerText: null,
    bannerType: 'idle'
  });

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

    // Responsive Canvas & High-DPI (Retina) scaling (Capped strictly at 1.35 for low-end GPU efficiency)
    const updateSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const render = () => {
      time += 0.025;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

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
      const cursor = cursorPosRef.current;
      if (cursor && isCanvasHoveredRef.current) {
        const { x, y } = cursor;
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

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    // IntersectionObserver to pause contour canvas when off-screen
    let isVisible = true;
    let isLoopRunning = false;

    const startLoop = () => {
      if (!isLoopRunning && isVisible) {
        isLoopRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      isLoopRunning = false;
      cancelAnimationFrame(animationFrameId);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.02 }
    );

    observer.observe(canvas);
    startLoop();

    return () => {
      observer.disconnect();
      stopLoop();
      window.removeEventListener('resize', updateSize);
    };
  }, [engine.balances.arcLiquidUsdc, engine.forecasting.targetBuffer30D]);

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

  // --------------------------------------------------------------------------
  // SEQUENTIAL POLICY EVALUATION PIPELINE (POL-01 -> POL-04 with 250ms Cryptographic Hex Scramble)
  // --------------------------------------------------------------------------
  const runPolicyEvaluation = async (payload: {
    vendorAddress: string;
    amountUsdc: number;
    category: string;
    invoiceRef: string;
    reasoning?: string;
  }) => {
    if (evalState.isEvaluating) return;

    const isBreach = payload.amountUsdc > 250;

    // Step 1: POL-01 CHECKING
    setEvalState({
      isEvaluating: true,
      activeBay: 0,
      bayStatuses: ['checking', 'idle', 'idle', 'idle'],
      bannerText: 'EVALUATING POL-01 // 30D OPERATING BUFFER >= 400,000 USDC',
      bannerType: 'checking'
    });
    setBayLabels(['[CHECKING...]', '[ENFORCED]', '[ENFORCED]', '[ENFORCED]']);
    await new Promise((r) => setTimeout(r, 120));

    // Scramble POL-01 into [PASSED]
    await new Promise<void>((resolve) => {
      scrambleText(
        (txt) => setBayLabels(prev => [txt, prev[1], prev[2], prev[3]]),
        '[PASSED]',
        250,
        resolve
      );
    });

    // Step 2: POL-02 CHECKING
    setEvalState({
      isEvaluating: true,
      activeBay: 1,
      bayStatuses: ['passed', 'checking', 'idle', 'idle'],
      bannerText: 'EVALUATING POL-02 // AUTONOMOUS SINGLE-TX CAP <= 250.00 USDC',
      bannerType: 'checking'
    });
    setBayLabels(prev => [prev[0], '[CHECKING...]', prev[2], prev[3]]);
    await new Promise((r) => setTimeout(r, 120));

    if (isBreach) {
      // Step 2b: POL-02 BREACHED! (Amount > 250 USDC)
      await new Promise<void>((resolve) => {
        scrambleText(
          (txt) => setBayLabels(prev => [prev[0], txt, prev[2], prev[3]]),
          '[BREACHED AT POL-02]',
          250,
          resolve
        );
      });

      setEvalState({
        isEvaluating: true,
        activeBay: 1,
        bayStatuses: ['passed', 'breached', 'idle', 'idle'],
        bannerText: 'BREACH DETECTED AT POL-02 // HALTED AT GOVERNANCE DATUM',
        bannerType: 'breached'
      });

      const res = await engine.processInvoice(payload);
      setSubmissionFeedback(`EXCEPTION HALTED AT DATUM: ${res.message}`);

      // Auto-glide down to Viewport 04 after 200ms
      setTimeout(() => {
        if (lenis) {
          lenis.scrollTo('#viewport-04-escalation', { duration: 1.1 });
        } else {
          scrollTo('#viewport-04-escalation');
        }
        window.dispatchEvent(
          new CustomEvent('sakellarious:replay-collision', {
            detail: { amount: payload.amountUsdc }
          })
        );
      }, 200);

      setTimeout(() => {
        setEvalState({
          isEvaluating: false,
          activeBay: -1,
          bayStatuses: ['idle', 'idle', 'idle', 'idle'],
          bannerText: null,
          bannerType: 'idle'
        });
        setBayLabels(['[ENFORCED]', '[ENFORCED]', '[ENFORCED]', '[ENFORCED]']);
      }, 4000);
      return;
    }

    // Step 2c: POL-02 PASSED (Compliant)
    await new Promise<void>((resolve) => {
      scrambleText(
        (txt) => setBayLabels(prev => [prev[0], txt, prev[2], prev[3]]),
        '[PASSED]',
        250,
        resolve
      );
    });

    // Step 3: POL-03 CHECKING
    setEvalState({
      isEvaluating: true,
      activeBay: 2,
      bayStatuses: ['passed', 'passed', 'checking', 'idle'],
      bannerText: 'EVALUATING POL-03 // OPENSANCTIONS SCREENING SCORE == 0.00',
      bannerType: 'checking'
    });
    setBayLabels(prev => [prev[0], prev[1], '[CHECKING...]', prev[3]]);
    await new Promise((r) => setTimeout(r, 120));

    // Scramble POL-03 into [PASSED]
    await new Promise<void>((resolve) => {
      scrambleText(
        (txt) => setBayLabels(prev => [prev[0], prev[1], txt, prev[3]]),
        '[PASSED]',
        250,
        resolve
      );
    });

    // Step 4: POL-04 CHECKING
    setEvalState({
      isEvaluating: true,
      activeBay: 3,
      bayStatuses: ['passed', 'passed', 'passed', 'checking'],
      bannerText: 'EVALUATING POL-04 // CIRCLE PAYMASTER GASLESS SPONSORSHIP',
      bannerType: 'checking'
    });
    setBayLabels(prev => [prev[0], prev[1], prev[2], '[CHECKING...]']);
    await new Promise((r) => setTimeout(r, 120));

    // Scramble POL-04 into [PASSED]
    await new Promise<void>((resolve) => {
      scrambleText(
        (txt) => setBayLabels(prev => [prev[0], prev[1], prev[2], txt]),
        '[PASSED]',
        250,
        resolve
      );
    });

    // Step 5: ALL 4 RULES PASSED! Flash #2E5A44 banner
    setEvalState({
      isEvaluating: true,
      activeBay: 4,
      bayStatuses: ['passed', 'passed', 'passed', 'passed'],
      bannerText: 'AUTONOMOUS EXECUTION CLEARED // ZERO HUMAN INTERVENTION',
      bannerType: 'cleared'
    });

    const res = await engine.processInvoice(payload);
    setSubmissionFeedback(`STATUS: ${res.status} // ${res.message}`);

    // Highlight newly inscribed row at the top of Viewport 05
    window.dispatchEvent(
      new CustomEvent('sakellarious:new-inscription', {
        detail: { folio: res.txHash || payload.invoiceRef }
      })
    );

    setTimeout(() => {
      setEvalState({
        isEvaluating: false,
        activeBay: -1,
        bayStatuses: ['idle', 'idle', 'idle', 'idle'],
        bannerText: null,
        bannerType: 'idle'
      });
      setBayLabels(['[ENFORCED]', '[ENFORCED]', '[ENFORCED]', '[ENFORCED]']);
    }, 4000);
  };

  // Handlers for invoice triggers
  const handleInjectCompliant = () => {
    runPolicyEvaluation({
      vendorAddress: '0x3333333333333333333333333333333333333333',
      amountUsdc: 120.00,
      category: 'INFRASTRUCTURE',
      invoiceRef: `INV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      reasoning: 'Hetzner Kubernetes bare-metal RPC node cluster'
    });
  };

  const handleInjectBreach = () => {
    runPolicyEvaluation({
      vendorAddress: '0x6666666666666666666666666666666666666666',
      amountUsdc: 500.00,
      category: 'VENDOR',
      invoiceRef: `INV-BREACH-${Math.floor(1000 + Math.random() * 9000)}`,
      reasoning: 'Enterprise SOC2 penetration test retainer'
    });
  };

  const handleTestSanctioned = async () => {
    setSubmissionFeedback('Evaluating address against OpenSanctions OFAC database...');
    const verdict = await engine.checkSanctions('0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c');
    setSubmissionFeedback(
      `SANCTIONS CHECK: ${verdict.status} // ${verdict.entityName} (HALTED ON-CHAIN)`
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(customAmount);
    if (isNaN(amt) || amt <= 0) return;

    runPolicyEvaluation({
      vendorAddress: customVendor,
      amountUsdc: amt,
      category: customCategory,
      invoiceRef: customInvoiceRef,
      reasoning: 'Custom Obligation Injection via Operator Console'
    });
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
          padding: '16px 36px',
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
            padding: '36px',
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
              data-monumental="true"
              data-telemetry={`LIQUID BUFFER // $${animLiquid.toFixed(2)} USDC`}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '16px',
                marginBottom: '12px',
                position: 'relative'
              }}
            >
              {/* Hidden JetBrains Mono Telemetry Underlay - Physical Inversion via 80px Metrological Lens */}
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '2px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  lineHeight: 1.35,
                  letterSpacing: '0.12em',
                  color: 'rgba(20, 20, 19, 0.04)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 0
                }}
              >
                ARC L1 // LIQUIDITY BUFFER: 420,000.00 USDC<br />
                MANDATORY FLOOR: 400,000.00 USDC // SURPLUS: 20,000.00 USDC
              </div>

              <div style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <div
                  className="shutter-reveal"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(3.25rem, 5.5vw, 6rem)',
                    fontWeight: 700,
                    lineHeight: 0.92,
                    letterSpacing: '-0.04em',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--mineral-ink)',
                    willChange: 'transform'
                  }}
                >
                  ${animLiquid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  color: 'var(--mineral-ink-muted)',
                  whiteSpace: 'nowrap'
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
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', marginTop: '4px', whiteSpace: 'nowrap' }}>
                  ${animUsyc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USYC
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
                onMouseEnter={() => { isCanvasHoveredRef.current = true; }}
                onMouseLeave={() => {
                  isCanvasHoveredRef.current = false;
                  cursorPosRef.current = null;
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  cursorPosRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  };
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
            RIGHT COLUMN (50%): POLICYWALLET RULE BAYS & LIVE OBLIGATION INJECTOR
            ==================================================================== */}
        <div
          style={{
            padding: '36px',
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

            {/* REAL-TIME POLICY EVALUATION BANNER */}
            {evalState.bannerText && (
              <div
                style={{
                  padding: '10px 16px',
                  marginBottom: '16px',
                  backgroundColor:
                    evalState.bannerType === 'cleared'
                      ? '#2E5A44'
                      : evalState.bannerType === 'breached'
                      ? '#C84B31'
                      : 'rgba(212, 148, 58, 0.15)',
                  border:
                    evalState.bannerType === 'checking'
                      ? '1px solid var(--signal-amber)'
                      : 'none',
                  color:
                    evalState.bannerType === 'checking'
                      ? 'var(--signal-amber)'
                      : '#F2EFE9',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <span>
                  {evalState.bannerType === 'cleared' && '■ '}
                  {evalState.bannerType === 'breached' && '▲ '}
                  {evalState.bannerType === 'checking' && '◌ '}
                  {evalState.bannerText}
                </span>
                <span style={{ fontSize: '9px', opacity: 0.85 }}>
                  {evalState.bannerType === 'cleared' && 'ARC L1 VALIDATED'}
                  {evalState.bannerType === 'breached' && 'AUTONOMOUS HALT'}
                  {evalState.bannerType === 'checking' && 'PIPELINE ACTIVE'}
                </span>
              </div>
            )}

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
                  backgroundColor:
                    evalState.bayStatuses[0] === 'checking'
                      ? 'rgba(212, 148, 58, 0.14)'
                      : evalState.bayStatuses[0] === 'passed'
                      ? 'rgba(46, 90, 68, 0.10)'
                      : 'transparent',
                  transition: 'background-color 140ms var(--ease-mechanical), color 140ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-01: 30D OPERATING BUFFER &gt;= 400,000 USDC
                  </span>
                  <span
                    className="rule-badge"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color:
                        evalState.bayStatuses[0] === 'checking'
                          ? 'var(--signal-amber)'
                          : 'var(--signal-verified)',
                      fontWeight: evalState.bayStatuses[0] === 'checking' ? 700 : 500
                    }}
                  >
                    {bayLabels[0]}
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
                  backgroundColor:
                    evalState.bayStatuses[1] === 'checking'
                      ? 'rgba(212, 148, 58, 0.14)'
                      : evalState.bayStatuses[1] === 'breached'
                      ? 'rgba(200, 75, 49, 0.16)'
                      : evalState.bayStatuses[1] === 'passed'
                      ? 'rgba(46, 90, 68, 0.10)'
                      : 'transparent',
                  transition: 'background-color 140ms var(--ease-mechanical), color 140ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: evalState.bayStatuses[1] === 'breached' ? 'var(--signal-tension)' : 'inherit'
                    }}
                  >
                    POL-02: AUTONOMOUS SINGLE-TX CAP &lt;= 250.00 USDC
                  </span>
                  <span
                    className="rule-badge"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color:
                        evalState.bayStatuses[1] === 'checking'
                          ? 'var(--signal-amber)'
                          : evalState.bayStatuses[1] === 'breached'
                          ? 'var(--signal-tension)'
                          : 'var(--signal-verified)',
                      fontWeight: evalState.bayStatuses[1] !== 'idle' ? 700 : 500
                    }}
                  >
                    {bayLabels[1]}
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
                  backgroundColor:
                    evalState.bayStatuses[2] === 'checking'
                      ? 'rgba(212, 148, 58, 0.14)'
                      : evalState.bayStatuses[2] === 'passed'
                      ? 'rgba(46, 90, 68, 0.10)'
                      : 'transparent',
                  transition: 'background-color 140ms var(--ease-mechanical), color 140ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-03: OPENSANCTIONS SCREENING SCORE == 0.00
                  </span>
                  <span
                    className="rule-badge"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color:
                        evalState.bayStatuses[2] === 'checking'
                          ? 'var(--signal-amber)'
                          : 'var(--signal-verified)',
                      fontWeight: evalState.bayStatuses[2] === 'checking' ? 700 : 500
                    }}
                  >
                    {bayLabels[2]}
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
                  backgroundColor:
                    evalState.bayStatuses[3] === 'checking'
                      ? 'rgba(212, 148, 58, 0.14)'
                      : evalState.bayStatuses[3] === 'passed'
                      ? 'rgba(46, 90, 68, 0.10)'
                      : 'transparent',
                  transition: 'background-color 140ms var(--ease-mechanical), color 140ms var(--ease-mechanical)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500 }}>
                    POL-04: CIRCLE PAYMASTER GASLESS SPONSORSHIP
                  </span>
                  <span
                    className="rule-badge"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color:
                        evalState.bayStatuses[3] === 'checking'
                          ? 'var(--signal-amber)'
                          : 'var(--signal-verified)',
                      fontWeight: evalState.bayStatuses[3] === 'checking' ? 700 : 500
                    }}
                  >
                    {bayLabels[3]}
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
});
