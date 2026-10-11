/**
 * Unit Tests for Pure Adapters & Formatters
 * Runner: Node 22 native test runner (node --experimental-strip-types --test)
 * Constraints: Zero external dependencies; zero test runner libraries.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUtcTimestamp,
  formatCurrencyUsdc,
  formatRawUsdc,
  classifyTxKind,
  adaptReceiptsToSlabs,
  adaptTreasurySummary,
  adaptGatewayReserves,
  adaptEscalations,
} from './adapters';
import type { ReceiptDto } from './types';

test('formatUtcTimestamp formats ISO strings correctly', () => {
  const result = formatUtcTimestamp('2026-10-03T20:40:21.830Z');
  assert.equal(result, '2026-10-03 20:40:21 UTC');
});

test('formatUtcTimestamp formats epoch seconds and millis', () => {
  assert.equal(formatUtcTimestamp(1728388800), '2024-10-08 12:00:00 UTC');
  assert.equal(formatUtcTimestamp(1728388800000), '2024-10-08 12:00:00 UTC');
});

test('formatUtcTimestamp tolerates invalid or empty inputs without throwing', () => {
  assert.equal(formatUtcTimestamp(undefined), '1970-01-01 00:00:00 UTC');
  assert.equal(formatUtcTimestamp(null), '1970-01-01 00:00:00 UTC');
  assert.equal(formatUtcTimestamp('not-a-date'), '1970-01-01 00:00:00 UTC');
});

test('formatCurrencyUsdc and formatRawUsdc edge formatting (0, smallest unit, 85000.00, above 2^53)', () => {
  // 0
  assert.equal(formatCurrencyUsdc(0), '$0.00');
  assert.equal(formatRawUsdc(0), '0.00');

  // Smallest unit (1 cent / 0.01)
  assert.equal(formatCurrencyUsdc(0.01), '$0.01');
  assert.equal(formatRawUsdc(0.01), '0.01');

  // 85000.00
  assert.equal(formatCurrencyUsdc(85000), '$85,000.00');
  assert.equal(formatCurrencyUsdc(85000.0), '$85,000.00');
  assert.equal(formatRawUsdc(85000), '85000.00');

  // Above 2^53 (Number.MAX_SAFE_INTEGER is 9007199254740991; test 9007199254740993)
  const largeIntStr = '9007199254740993';
  assert.equal(formatCurrencyUsdc(largeIntStr), '$9,007,199,254,740,993.00');
  assert.equal(formatRawUsdc(largeIntStr), '9007199254740993.00');
  assert.equal(formatCurrencyUsdc(9007199254740993n), '$9,007,199,254,740,993.00');
  assert.equal(formatRawUsdc(9007199254740993n), '9007199254740993.00');

  // Null/undefined fallbacks
  assert.equal(formatCurrencyUsdc(undefined), '$0.00');
  assert.equal(formatRawUsdc(null), '0.00');
});

test('classifyTxKind correctly separates simulated vs unknown per Part B.1', () => {
  // Payouts, sweeps, and redemptions use Math.random() in backend -> simulated
  assert.equal(classifyTxKind('JIT_VENDOR_PAYMENT', '0xabc'), 'simulated');
  assert.equal(classifyTxKind('INVOICE_PAYOUT', '0xabc'), 'simulated');
  assert.equal(classifyTxKind('YIELD_SWEEP', '0xabc'), 'simulated');
  assert.equal(classifyTxKind('REDEEM_USYC', '0xabc'), 'simulated');
  assert.equal(classifyTxKind('YIELD_REDEMPTION', '0xabc'), 'simulated');

  // Escalations approvals depend on runtime config -> unknown
  assert.equal(classifyTxKind('ESCALATION_APPROVAL', '0xabc'), 'unknown');

  // Unrecognized or missing hash -> unknown
  assert.equal(classifyTxKind('UNKNOWN_ACTION', '0xabc'), 'unknown');
  assert.equal(classifyTxKind('JIT_VENDOR_PAYMENT', ''), 'unknown');
  assert.equal(classifyTxKind('JIT_VENDOR_PAYMENT', undefined), 'unknown');
});

test('adaptReceiptsToSlabs derives ordinal IDs, deduplicates, and sorts stably', () => {
  const sampleReceipt1: ReceiptDto = {
    '@context': 'https://sakellarious.dev/schemas/audit-v5.jsonld',
    type: 'AgentExecutionReceipt',
    timestamp: '2026-10-05T12:00:00.000Z',
    agentId: '0x2222',
    action: 'JIT_VENDOR_PAYMENT',
    amountUsdc: 100,
    txHash: '0x1111',
    category: 'INFRASTRUCTURE',
    vendorAddress: '0x3333',
    sanctionsVerification: { provider: 'test', status: 'CLEAN', queriedAt: '' },
    smartContractVerification: {
      policyContract: '0x9999',
      dailyLimitRemaining: 900,
      singleTxCheckPassed: true,
      whitelistVerified: true,
      reentrancyGuardActive: true,
      escalationNonce: 1,
    },
    usycYieldImpact: { redeemedFromUsyc: false, liquidUsdcAvailable: 1000 },
  };

  const sampleReceipt2: ReceiptDto = {
    ...sampleReceipt1,
    timestamp: '2026-10-01T10:00:00.000Z', // earlier timestamp (out of order test)
    txHash: '0x2222',
    amountUsdc: 250,
  };

  // Provide out-of-order records plus a duplicate of receipt 1
  const payload = {
    success: true,
    data: [sampleReceipt1, sampleReceipt2, sampleReceipt1],
  };

  const slabs = adaptReceiptsToSlabs(payload);

  // Assert deduplication: 3 inputs -> 2 outputs
  assert.equal(slabs.length, 2);

  // Assert chronological sorting: receipt2 should be first
  assert.equal(slabs[0].amountRaw, '250.00');
  assert.equal(slabs[0].id, 'EUTHYNA #00001');
  assert.equal(slabs[0].idSource, 'derived-ordinal');
  assert.equal(slabs[0].txKind, 'simulated');
  assert.equal(slabs[0].provenance.id, 'derived');
  assert.equal(slabs[0].provenance.amount, 'live');

  // Assert second receipt
  assert.equal(slabs[1].amountRaw, '100.00');
  assert.equal(slabs[1].id, 'EUTHYNA #00002');
});

test('adaptReceiptsToSlabs tolerates malformed or empty payloads without throwing', () => {
  assert.deepEqual(adaptReceiptsToSlabs(null), []);
  assert.deepEqual(adaptReceiptsToSlabs({}), []);
  assert.deepEqual(adaptReceiptsToSlabs('invalid'), []);
});

test('adaptTreasurySummary resolves chain ID dynamically and formats metrics', () => {
  const summaryPayload = {
    success: true,
    data: {
      policyWallet: {
        address: '0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0',
        agentAddress: '0xAgent',
        ownerAddress: '0xOwner',
        dailyLimit: 1000,
        maxSingleTx: 250,
        spentToday: 150,
        dailyLimitRemaining: 850,
        categoryLimits: {},
        categorySpentToday: {},
        escalationNonce: 2,
      },
      balances: {
        arcLiquidUsdc: 1500,
        arcUsycVault: 5000,
        totalArcCapital: 6500,
      },
      cashFlowForecasting: {
        targetBuffer30D: 2000,
        fixedExpensesSum: 500,
        variableAPSum: 300,
        yieldSweepStatus: { shouldSweep: true, reason: 'Surplus liquidity above buffer' },
      },
      pendingEscalationsCount: 1,
    },
  };

  const catalogPayload = {
    service: 'api',
    status: 'ONLINE',
    network: 'Arc Testnet (Chain ID 5042002)',
    policyWallet: '0xWallet',
    endpoints: {},
  };

  const vm = adaptTreasurySummary(summaryPayload, catalogPayload);

  assert.equal(vm.liquidUsdcFormatted, '$1,500.00');
  assert.equal(vm.usycVaultFormatted, '$5,000.00');
  assert.equal(vm.totalCapitalFormatted, '$6,500.00');
  assert.equal(vm.shouldSweepYield, true);
  assert.equal(vm.chainId, 5042002);
  assert.equal(vm.networkName, 'Arc Testnet (Chain ID 5042002)');
  assert.equal(vm.provenance.liquidUsdc, 'live');
  assert.equal(vm.provenance.chainId, 'live');
});

test('adaptGatewayReserves and adaptEscalations tolerate empty and map correctly', () => {
  assert.deepEqual(adaptGatewayReserves(null), []);
  assert.deepEqual(adaptEscalations(null), []);

  const escalationsPayload = {
    success: true,
    data: [
      {
        txId: '0xabc',
        vendor: '0x123',
        amount: 400,
        category: 'VENDOR',
        invoiceRef: 'INV-1',
        reasoningHash: '0x0',
        reasoning: 'Bounty',
        createdAt: 1728388800,
        agentApproved: true,
        ownerApproved: false,
        executed: false,
        cancelled: false,
        requiresSupervisorReason: 'Exceeds cap',
        txHash: '0xreal',
      },
    ],
  };

  const list = adaptEscalations(escalationsPayload);
  assert.equal(list.length, 1);
  assert.equal(list[0].amountFormatted, '$400.00');
  assert.equal(list[0].txKind, 'unknown');
});
