/**
 * API Data Transfer Objects (DTOs), Runtime Type Guards, and View Models
 * Reference: docs/integration/CONTRACT.md
 * Segregation: Zero backend dependencies; zero external validation libraries.
 */

// ============================================================================
// 1. Provenance & Classification Types (Decisions D1, D2, D4)
// ============================================================================

export type SourceKind = 'live' | 'derived' | 'static';
export type TxKind = 'onchain' | 'simulated' | 'unknown';
export type IdSource = 'derived-ordinal';

export interface FieldProvenance<T> {
  value: T;
  source: SourceKind;
}

// ============================================================================
// 2. Authoritative DTOs (docs/integration/CONTRACT.md)
// ============================================================================

export interface ApiCatalogDto {
  service: string;
  status: string;
  network: string;
  policyWallet: string;
  endpoints: Record<string, string>;
  frontendAppUrl?: string;
}

export interface PolicyWalletTelemetryDto {
  address: string;
  agentAddress: string;
  ownerAddress: string;
  dailyLimit: number;
  maxSingleTx: number;
  spentToday: number;
  dailyLimitRemaining: number;
  categoryLimits: Record<string, number>;
  categorySpentToday: Record<string, number>;
  escalationNonce: number;
}

export interface TreasuryBalancesDto {
  arcLiquidUsdc: number;
  arcUsycVault: number;
  totalArcCapital: number;
  multichainReserves?: Record<string, unknown>;
}

export interface CashFlowForecastingDto {
  targetBuffer30D: number;
  fixedExpensesSum: number;
  variableAPSum: number;
  yieldSweepStatus: {
    shouldSweep: boolean;
    reason: string;
  };
}

export interface TreasurySummaryDataDto {
  policyWallet: PolicyWalletTelemetryDto;
  balances: TreasuryBalancesDto;
  cashFlowForecasting: CashFlowForecastingDto;
  pendingEscalationsCount: number;
}

export interface TreasurySummaryResponseDto {
  success: boolean;
  data: TreasurySummaryDataDto;
}

export interface GatewayChainDto {
  chainName: string;
  chainId: number;
  usdcBalance: number;
  usycBalance: number;
  isNativeSettlement: boolean;
}

export interface GatewayReservesDataDto {
  gatewayStatus: string;
  lastSyncedAt: string;
  corporateAddress: string;
  chains: GatewayChainDto[];
}

export interface GatewayReservesResponseDto {
  success: boolean;
  data: GatewayReservesDataDto;
}

export interface ProcessedInvoiceDto {
  invoiceRef: string;
  vendor: string;
  amount: number;
  category: string;
  status: string;
  paymasterSponsored: boolean;
  txHash: string;
  settledAt: string;
}

export interface PendingEscalationDto {
  txId: string;
  vendor: string;
  amount?: number;
  category: string;
  invoiceRef: string;
  reasoningHash: string;
  reasoning: string;
  createdAt?: number;
  agentApproved: boolean;
  ownerApproved: boolean;
  executed: boolean;
  cancelled: boolean;
  requiresSupervisorReason: string;
  txHash?: string;
}

export interface InvoicesDataDto {
  processed: ProcessedInvoiceDto[];
  pendingEscalation: PendingEscalationDto[];
}

export interface InvoicesResponseDto {
  success: boolean;
  data: InvoicesDataDto;
}

export interface EscalationsResponseDto {
  success: boolean;
  data: PendingEscalationDto[];
}

export interface ReceiptSanctionsDto {
  provider: string;
  status: string;
  queriedAt: string;
}

export interface ReceiptSmartContractDto {
  policyContract: string;
  dailyLimitRemaining: number;
  singleTxCheckPassed: boolean;
  whitelistVerified: boolean;
  reentrancyGuardActive: boolean;
  escalationNonce: number;
}

export interface ReceiptUsycImpactDto {
  redeemedFromUsyc: boolean;
  liquidUsdcAvailable: number;
}

export interface ReceiptDto {
  '@context': string;
  type: string;
  timestamp: string;
  agentId: string;
  action: string;
  vendorAddress?: string;
  amountUsdc?: number;
  category?: string;
  invoiceRef?: string;
  sanctionsVerification: ReceiptSanctionsDto;
  smartContractVerification: ReceiptSmartContractDto;
  usycYieldImpact: ReceiptUsycImpactDto;
  txHash: string;
}

export interface ReceiptsResponseDto {
  success: boolean;
  data: ReceiptDto[];
}

export interface ErrorResponseDto {
  success: false;
  error: string;
}

// ============================================================================
// 3. View Models (UI Consumable, with Provenance & Formatting)
// ============================================================================

export interface SlabViewModel {
  id: string; // e.g. "EUTHYNA #00001"
  idSource: IdSource;
  amount?: number;
  amountDisplay?: string; // "$150.00"
  amountRaw?: string; // "150.00"
  asset: string; // "USDC // ARC L1"
  action?: string;
  invoiceRef?: string;
  vendor?: string;
  policyTag: string; // "POL-01 [JIT_PAYMENT]"
  status: 'VERIFIED' | 'PENDING' | 'HALTED';
  timestampUtc?: string; // "YYYY-MM-DD HH:mm:ss UTC"
  category: string;
  counterparty: string;
  txHash: string;
  txKind: TxKind;
  paymasterStatus: string;
  provenance: {
    id: SourceKind;
    amount: SourceKind;
    asset: SourceKind;
    policyTag: SourceKind;
    status: SourceKind;
    timestamp: SourceKind;
    category: SourceKind;
    counterparty: SourceKind;
    txHash: SourceKind;
    paymasterStatus: SourceKind;
  };
}

export interface TreasurySummaryViewModel {
  liquidUsdc: number;
  usycVault: number;
  totalCapital: number;
  dailyLimit: number;
  spentToday: number;
  dailyLimitRemaining: number;
  maxSingleTx?: number;
  targetBuffer30D?: number;
  escalationNonce?: number;
  categoryLimits?: Record<string, number>;
  categorySpentToday?: Record<string, number>;
  liquidUsdcFormatted: string;
  usycVaultFormatted: string;
  totalCapitalFormatted: string;
  dailyLimitFormatted: string;
  spentTodayFormatted: string;
  dailyLimitRemainingFormatted: string;
  policyWalletAddress: string;
  agentAddress: string;
  ownerAddress: string;
  pendingEscalationsCount: number;
  shouldSweepYield: boolean;
  sweepReason: string;
  networkName: string;
  chainId: number;
  provenance: {
    liquidUsdc: SourceKind;
    usycVault: SourceKind;
    totalCapital: SourceKind;
    dailyLimit: SourceKind;
    spentToday: SourceKind;
    dailyLimitRemaining: SourceKind;
    addresses: SourceKind;
    pendingEscalationsCount: SourceKind;
    networkName: SourceKind;
    chainId: SourceKind;
  };
}

export interface GatewayChainViewModel {
  chainName: string;
  chainId: number;
  usdcBalance?: number;
  usycBalance?: number;
  usdcBalanceFormatted: string;
  usycBalanceFormatted: string;
  isNativeSettlement: boolean;
  provenance: SourceKind;
}

export interface EscalationViewModel {
  txId: string;
  invoiceRef: string;
  vendor: string;
  amount?: number;
  amountFormatted?: string;
  category: string;
  reasoning: string;
  requiresSupervisorReason: string;
  createdAtMs?: number;
  createdAtUtc?: string;
  expiresAtMs?: number;
  escalationNonce?: number;
  timelockRemainingSeconds?: number;
  ownerApproved: boolean;
  executed: boolean;
  cancelled: boolean;
  txHash?: string;
  txKind: TxKind;
  provenance: SourceKind;
}

// ============================================================================
// 4. Hand-written Runtime Type Guards (Zero Dependencies)
// ============================================================================

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isApiCatalogDto(value: unknown): value is ApiCatalogDto {
  if (!isRecord(value)) return false;
  return (
    typeof value.service === 'string' &&
    typeof value.status === 'string' &&
    typeof value.network === 'string' &&
    typeof value.policyWallet === 'string' &&
    isRecord(value.endpoints)
  );
}

export function isTreasurySummaryResponseDto(value: unknown): value is TreasurySummaryResponseDto {
  if (!isRecord(value)) return false;
  if (value.success !== true || !isRecord(value.data)) return false;
  const d = value.data;
  if (!isRecord(d.policyWallet) || !isRecord(d.balances) || !isRecord(d.cashFlowForecasting)) return false;
  const pw = d.policyWallet;
  const b = d.balances;
  return (
    typeof pw.address === 'string' &&
    typeof pw.dailyLimit === 'number' &&
    typeof pw.spentToday === 'number' &&
    typeof b.arcLiquidUsdc === 'number' &&
    typeof b.arcUsycVault === 'number' &&
    typeof d.pendingEscalationsCount === 'number'
  );
}

export function isGatewayReservesResponseDto(value: unknown): value is GatewayReservesResponseDto {
  if (!isRecord(value)) return false;
  if (value.success !== true || !isRecord(value.data)) return false;
  const d = value.data;
  if (typeof d.gatewayStatus !== 'string' || !Array.isArray(d.chains)) return false;
  return d.chains.every(
    (c) =>
      isRecord(c) &&
      typeof c.chainName === 'string' &&
      typeof c.chainId === 'number' &&
      (c.usdcBalance === undefined || typeof c.usdcBalance === 'number')
  );
}

export function isInvoicesResponseDto(value: unknown): value is InvoicesResponseDto {
  if (!isRecord(value)) return false;
  if (value.success !== true || !isRecord(value.data)) return false;
  const d = value.data;
  return Array.isArray(d.processed) && Array.isArray(d.pendingEscalation);
}

export function isEscalationsResponseDto(value: unknown): value is EscalationsResponseDto {
  if (!isRecord(value)) return false;
  if (value.success !== true || !Array.isArray(value.data)) return false;
  return value.data.every(
    (e) => isRecord(e) && typeof e.txId === 'string' && (e.amount === undefined || typeof e.amount === 'number')
  );
}

export function isReceiptDto(value: unknown): value is ReceiptDto {
  if (!isRecord(value)) return false;
  return (
    typeof value['@context'] === 'string' &&
    typeof value.type === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.agentId === 'string' &&
    typeof value.action === 'string' &&
    (value.amountUsdc === undefined || typeof value.amountUsdc === 'number') &&
    typeof value.txHash === 'string'
  );
}

export function isReceiptsResponseDto(value: unknown): value is ReceiptsResponseDto {
  if (!isRecord(value)) return false;
  if (value.success !== true || !Array.isArray(value.data)) return false;
  return value.data.every(isReceiptDto);
}

export function isErrorResponseDto(value: unknown): value is ErrorResponseDto {
  if (!isRecord(value)) return false;
  return value.success === false && typeof value.error === 'string';
}
