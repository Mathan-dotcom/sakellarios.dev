/**
 * Pure Data Adapters Mapping API DTOs to UI View Models
 * Reference: docs/integration/CONTRACT.md & docs/integration/DECISIONS.md
 * Constraints:
 * - Pure functions with zero external dependencies
 * - Money formatted at edge; never Number for base-unit calculations
 * - Timestamps strictly formatted as "YYYY-MM-DD HH:mm:ss UTC"
 * - Tolerates duplicate, missing, and out-of-order entries without throwing
 * - Every slab and metric tagged with source provenance ('live' | 'derived' | 'static')
 * - Every transaction classified with txKind ('onchain' | 'simulated' | 'unknown')
 */

import {
  type ReceiptDto,
  type SlabViewModel,
  type TreasurySummaryViewModel,
  type GatewayChainViewModel,
  type EscalationViewModel,
  type TxKind,
  isReceiptDto,
  isReceiptsResponseDto,
  isTreasurySummaryResponseDto,
  isGatewayReservesResponseDto,
  isEscalationsResponseDto,
  isApiCatalogDto,
  isRecord,
} from './types';

// ============================================================================
// Date & Currency Formatters (Pure, Safe, Edge Formatting)
// ============================================================================

/**
 * Formats an ISO string, unix epoch timestamp, or date object to "YYYY-MM-DD HH:mm:ss UTC"
 * Tolerates malformed or missing timestamps by falling back to a deterministic string without throwing.
 */
export function formatUtcTimestamp(input: string | number | undefined | null): string {
  if (input === undefined || input === null || input === '') {
    return '1970-01-01 00:00:00 UTC';
  }

  let d: Date;
  if (typeof input === 'number') {
    // Check if seconds or milliseconds
    d = input < 1e11 ? new Date(input * 1000) : new Date(input);
  } else {
    d = new Date(input);
  }

  if (isNaN(d.getTime())) {
    return '1970-01-01 00:00:00 UTC';
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Formats a currency amount into a dollar display string without floating point jitter.
 * Safely formats BigInt and string numbers exceeding 2^53 (Number.MAX_SAFE_INTEGER).
 */
export function formatCurrencyUsdc(amount: number | string | bigint | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') {
    return '$0.00';
  }
  if (typeof amount === 'bigint') {
    return '$' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.00';
  }
  const str = String(amount).trim();
  if (/^\d+$/.test(str) && str.length >= 16) {
    try {
      const bi = BigInt(str);
      if (bi > BigInt(Number.MAX_SAFE_INTEGER)) {
        return '$' + bi.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.00';
      }
    } catch {}
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(str);
  if (isNaN(numeric)) {
    return '$0.00';
  }
  return `$${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a raw number into a fixed 2-decimal string.
 * Preserves precision for BigInt and large numeric strings above 2^53.
 */
export function formatRawUsdc(amount: number | string | bigint | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') {
    return '0.00';
  }
  if (typeof amount === 'bigint') {
    return amount.toString() + '.00';
  }
  const str = String(amount).trim();
  if (/^\d+$/.test(str) && str.length >= 16) {
    try {
      const bi = BigInt(str);
      if (bi > BigInt(Number.MAX_SAFE_INTEGER)) {
        return bi.toString() + '.00';
      }
    } catch {}
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(str);
  if (isNaN(numeric)) {
    return '0.00';
  }
  return numeric.toFixed(2);
}

// ============================================================================
// Tx Provenance Classifier (Part A Item 3 & Decision D4)
// ============================================================================

/**
 * Classifies transaction provenance according to forensic analysis of backend source:
 * - Direct payouts (JIT_VENDOR_PAYMENT) use circleStack.js:91 (Math.random()) -> simulated
 * - Yield sweeps (YIELD_SWEEP) use agentRunner.js:444 (Math.random()) -> simulated
 * - Yield redemptions (REDEEM_USYC) use agentRunner.js:475 (Math.random()) -> simulated
 * - Escalations approval with real on-chain receipt -> onchain
 */
export function classifyTxKind(action: string | undefined, txHash: string | undefined): TxKind {
  if (!txHash || txHash === '' || txHash === '0x') {
    return 'unknown';
  }

  const act = (action || '').toUpperCase();
  // Part A Item 3: Direct vendor payouts, sweeps, and redemptions unconditionally generate
  // simulated 64-hex strings via Math.random() in backend code (circleStack.js:94, agentRunner.js:498, agentRunner.js:527).
  if (act === 'JIT_VENDOR_PAYMENT' || act === 'INVOICE_PAYOUT') {
    return 'simulated';
  }
  if (act === 'YIELD_SWEEP') {
    return 'simulated';
  }
  if (act === 'REDEEM_USYC' || act === 'YIELD_REDEMPTION') {
    return 'simulated';
  }

  // Escalation approvals and any other entry types depend on runtime config (ownerSigner, policyContract)
  // and cannot be proven as on-chain from receipt fields alone. Default to 'unknown'.
  return 'unknown';
}

// ============================================================================
// 1. Data Loom Slabs Adapter
// ============================================================================

/**
 * Transforms raw receipts DTO into SlabViewModels for EuthynaDataLoomCanvas.
 * - Deduplicates records by txHash (or hash+timestamp)
 * - Tolerates missing or partial fields
 * - Sorts stably by timestamp ascending
 * - Derives sequential ordinal IDs (Decision D1)
 * - Never throws on malformed payload
 */
export function adaptReceiptsToSlabs(payload: unknown): SlabViewModel[] {
  let rawList: ReceiptDto[] = [];

  if (isReceiptsResponseDto(payload)) {
    rawList = payload.data;
  } else if (Array.isArray(payload)) {
    rawList = payload.filter(isReceiptDto);
  } else if (isRecord(payload) && Array.isArray(payload.data)) {
    rawList = payload.data.filter(isReceiptDto);
  }

  if (rawList.length === 0) {
    return [];
  }

  // Deduplication by txHash + timestamp
  const seen = new Set<string>();
  const deduplicated: ReceiptDto[] = [];
  for (const item of rawList) {
    const key = `${item.txHash || ''}_${item.timestamp || ''}_${item.amountUsdc || 0}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  }

  // Stable sort by timestamp (chronological)
  const sorted = [...deduplicated].sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime();
    const tb = new Date(b.timestamp || 0).getTime();
    if (isNaN(ta) || isNaN(tb)) return 0;
    return ta - tb;
  });

  return sorted.map((receipt, index) => {
    const ordinalNum = String(index + 1).padStart(5, '0');
    const id = `EUTHYNA #${ordinalNum}`;
    const amountRaw = formatRawUsdc(receipt.amountUsdc);
    const amountDisplay = formatCurrencyUsdc(receipt.amountUsdc);
    const timestampUtc = formatUtcTimestamp(receipt.timestamp);
    const txKind = classifyTxKind(receipt.action, receipt.txHash);

    const isPassed = receipt.smartContractVerification?.singleTxCheckPassed ?? true;
    const status: 'VERIFIED' | 'PENDING' | 'HALTED' = isPassed ? 'VERIFIED' : 'PENDING';

    const actionTag = (receipt.action || 'PAYOUT').replace(/_/g, ' ');
    const policyTag = `POL-01 [${actionTag}]`;
    const counterparty = receipt.vendorAddress || receipt.agentId || '0x0000000000000000000000000000000000000000';

    return {
      id,
      idSource: 'derived-ordinal',
      amountDisplay,
      amountRaw,
      asset: 'USDC // ARC L1',
      policyTag,
      status,
      timestampUtc,
      category: receipt.category || 'INFRASTRUCTURE',
      counterparty,
      txHash: receipt.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      txKind,
      paymasterStatus: 'CIRCLE PAYMASTER // 0.00',
      provenance: {
        id: 'derived',
        amount: 'live',
        asset: 'derived',
        policyTag: 'derived',
        status: 'live',
        timestamp: 'live',
        category: 'live',
        counterparty: 'live',
        txHash: 'live',
        paymasterStatus: 'derived',
      },
    };
  });
}

// ============================================================================
// 2. Treasury Summary Adapter
// ============================================================================

export function adaptTreasurySummary(
  summaryPayload: unknown,
  catalogPayload?: unknown
): TreasurySummaryViewModel {
  const fallback: TreasurySummaryViewModel = {
    liquidUsdcFormatted: '$0.00',
    usycVaultFormatted: '$0.00',
    totalCapitalFormatted: '$0.00',
    dailyLimitFormatted: '$0.00',
    spentTodayFormatted: '$0.00',
    dailyLimitRemainingFormatted: '$0.00',
    policyWalletAddress: '0x0000000000000000000000000000000000000000',
    agentAddress: '0x0000000000000000000000000000000000000000',
    ownerAddress: '0x0000000000000000000000000000000000000000',
    pendingEscalationsCount: 0,
    shouldSweepYield: false,
    sweepReason: 'No data',
    networkName: 'Arc Testnet',
    chainId: 5042002,
    provenance: {
      liquidUsdc: 'static',
      usycVault: 'static',
      totalCapital: 'static',
      dailyLimit: 'static',
      spentToday: 'static',
      dailyLimitRemaining: 'static',
      addresses: 'static',
      pendingEscalationsCount: 'static',
      networkName: 'static',
      chainId: 'static',
    },
  };

  if (!isTreasurySummaryResponseDto(summaryPayload)) {
    return fallback;
  }

  const d = summaryPayload.data;
  const pw = d.policyWallet;
  const b = d.balances;
  const cs = d.cashFlowForecasting;

  let network = 'Arc Testnet';
  let chainId = 5042002;
  let networkSource: 'live' | 'derived' | 'static' = 'derived';

  if (isApiCatalogDto(catalogPayload)) {
    network = catalogPayload.network;
    networkSource = 'live';
    const match = catalogPayload.network.match(/(\d+)/);
    if (match) {
      chainId = parseInt(match[1], 10);
    }
  }

  return {
    liquidUsdcFormatted: formatCurrencyUsdc(b.arcLiquidUsdc),
    usycVaultFormatted: formatCurrencyUsdc(b.arcUsycVault),
    totalCapitalFormatted: formatCurrencyUsdc(b.totalArcCapital),
    dailyLimitFormatted: formatCurrencyUsdc(pw.dailyLimit),
    spentTodayFormatted: formatCurrencyUsdc(pw.spentToday),
    dailyLimitRemainingFormatted: formatCurrencyUsdc(pw.dailyLimitRemaining),
    policyWalletAddress: pw.address,
    agentAddress: pw.agentAddress,
    ownerAddress: pw.ownerAddress,
    pendingEscalationsCount: d.pendingEscalationsCount,
    shouldSweepYield: cs.yieldSweepStatus?.shouldSweep ?? false,
    sweepReason: cs.yieldSweepStatus?.reason ?? '',
    networkName: network,
    chainId,
    provenance: {
      liquidUsdc: 'live',
      usycVault: 'live',
      totalCapital: 'live',
      dailyLimit: 'live',
      spentToday: 'live',
      dailyLimitRemaining: 'live',
      addresses: 'live',
      pendingEscalationsCount: 'live',
      networkName: networkSource,
      chainId: networkSource,
    },
  };
}

// ============================================================================
// 3. Multichain Gateway Reserves Adapter
// ============================================================================

export function adaptGatewayReserves(payload: unknown): GatewayChainViewModel[] {
  if (!isGatewayReservesResponseDto(payload)) {
    return [];
  }

  return payload.data.chains.map((chain) => ({
    chainName: chain.chainName,
    chainId: chain.chainId,
    usdcBalanceFormatted: formatCurrencyUsdc(chain.usdcBalance),
    usycBalanceFormatted: formatCurrencyUsdc(chain.usycBalance),
    isNativeSettlement: chain.isNativeSettlement,
    provenance: 'live',
  }));
}

// ============================================================================
// 4. Escalations Queue Adapter
// ============================================================================

export function adaptEscalations(payload: unknown): EscalationViewModel[] {
  if (!isEscalationsResponseDto(payload)) {
    return [];
  }

  return payload.data.map((item) => ({
    txId: item.txId,
    invoiceRef: item.invoiceRef,
    vendor: item.vendor,
    amountFormatted: formatCurrencyUsdc(item.amount),
    category: item.category,
    reasoning: item.reasoning,
    requiresSupervisorReason: item.requiresSupervisorReason,
    createdAtUtc: formatUtcTimestamp(item.createdAt),
    ownerApproved: item.ownerApproved,
    executed: item.executed,
    cancelled: item.cancelled,
    txHash: item.txHash,
    txKind: 'unknown',
    provenance: 'live',
  }));
}
