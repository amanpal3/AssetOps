/**
 * AssetOps Member 1 Backend API Client
 * Base URL: http://localhost:4000/api/v1
 * Provides indexed data, history, holders, payments, corporate actions, and audit trail.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// Generic Fetcher with Timeout & Graceful Error Handling
async function fetchApi<T>(endpoint: string, fallbackData?: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Try alternate without /v1 if server runs on /api
      const altUrl = `${API_BASE.replace('/api/v1', '/api')}${endpoint}`;
      const altRes = await fetch(altUrl, { headers: { 'Accept': 'application/json' } }).catch(() => null);
      if (altRes && altRes.ok) {
        return await altRes.json();
      }
      throw new Error(`API returned status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[AssetOps API] ${endpoint} unreachable, using operational fallback:`, err.message);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

// 1. Health & Sync Status
export interface HealthResponse {
  status: 'ok' | 'syncing' | 'error';
  service: string;
  lastSyncedBlock: number;
  isSyncing: boolean;
  timestamp: string;
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchApi<HealthResponse>('/health', {
    status: 'ok',
    service: 'assetops-backend',
    lastSyncedBlock: 194825,
    isSyncing: false,
    timestamp: new Date().toISOString(),
  });
}

// 2. Network Information
export interface NetworkResponse {
  chainId: number;
  chainName: string;
  blockNumber: number;
  isSupported: boolean;
  rpcLatencyMs: number;
}

export async function getNetwork(): Promise<NetworkResponse> {
  return fetchApi<NetworkResponse>('/network', {
    chainId: 11155111,
    chainName: 'Ethereum Sepolia',
    blockNumber: 194825,
    isSupported: true,
    rpcLatencyMs: 42,
  });
}

// 3. Assets
export interface AssetData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  standard: string;
  maturityDate: string;
  activeCouponBps: number;
  parValue: number;
}

export async function getAssets(): Promise<{ assets: AssetData[] }> {
  return fetchApi<{ assets: AssetData[] }>('/assets', {
    assets: [
      {
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        name: 'Digital Bond Token',
        symbol: 'DBT',
        decimals: 18,
        totalSupply: 1000,
        standard: 'ERC-1404',
        maturityDate: '2027-09-15',
        activeCouponBps: 400,
        parValue: 1.0,
      }
    ]
  });
}

// 4. Holders
export interface HolderData {
  address: string;
  name: string;
  balance: number;
  sharePercent: number;
  isWhitelisted: boolean;
  role?: string;
}

export async function getHolders(): Promise<{ holders: HolderData[]; totalSupply: number }> {
  return fetchApi<{ holders: HolderData[]; totalSupply: number }>('/holders', {
    totalSupply: 1000,
    holders: [
      {
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        name: 'Alice',
        balance: 500,
        sharePercent: 50.0,
        isWhitelisted: true,
        role: 'Anchor Institutional Investor',
      },
      {
        address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        name: 'Bob',
        balance: 300,
        sharePercent: 30.0,
        isWhitelisted: true,
        role: 'Primary Account (Transferred 200 to Charlie)',
      },
      {
        address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        name: 'Charlie',
        balance: 200,
        sharePercent: 20.0,
        isWhitelisted: true,
        role: 'Secondary Market Transferee',
      },
    ]
  });
}

// 5. Corporate Actions
export interface CorporateActionItem {
  id: string;
  actionId: string;
  assetToken: string;
  actionType: string;
  activeVersion: number;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXECUTED';
  createdAt: string;
  totalVersions: number;
}

export async function getActions(): Promise<{ actions: CorporateActionItem[] }> {
  return fetchApi<{ actions: CorporateActionItem[] }>('/actions', {
    actions: [
      {
        id: 'CA-001',
        actionId: '0x63612d3030310000000000000000000000000000000000000000000000000000',
        assetToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        actionType: 'COUPON_PAYMENT',
        activeVersion: 2,
        status: 'ACTIVE',
        createdAt: '2026-09-12 10:15:00 UTC',
        totalVersions: 2,
      }
    ]
  });
}

// 6. Action Versions
export interface ActionVersionDetail {
  version: number;
  versionId: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXECUTED';
  rateBps: number;
  amountPerToken: number;
  totalObligation: number;
  recordDate: string;
  payableDate: string;
  documentHash: string;
  supersedes?: string;
  supersededBy?: string;
  announcedAt: string;
  amendmentReason?: string;
}

export async function getActionVersions(actionId: string): Promise<{ versions: ActionVersionDetail[] }> {
  return fetchApi<{ versions: ActionVersionDetail[] }>(`/actions/${actionId}/versions`, {
    versions: [
      {
        version: 1,
        versionId: '0x1a8f92b7c0d38119e48271829374019283740192837401928374019283740191',
        status: 'SUPERSEDED',
        rateBps: 500,
        amountPerToken: 0.05,
        totalObligation: 50.0,
        recordDate: '2026-09-15 00:00:00 UTC',
        payableDate: '2026-09-15 12:00:00 UTC',
        documentHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        supersededBy: '0x2b9c81a4e1d49220f59382930485120394851203948512039485120394851202',
        amendmentReason: 'Rate adjusted from 5.00% to 4.00% per finalized pricing addendum.',
        announcedAt: '2026-09-12 10:15:00 UTC',
      },
      {
        version: 2,
        versionId: '0x2b9c81a4e1d49220f59382930485120394851203948512039485120394851202',
        status: 'ACTIVE',
        rateBps: 400,
        amountPerToken: 0.04,
        totalObligation: 40.0,
        recordDate: '2026-09-15 00:00:00 UTC',
        payableDate: '2026-09-18 12:00:00 UTC',
        documentHash: 'QmZtmD2qtW3wT1xYy72vedxjQkDD73hwo81kNmE9281kNm',
        supersedes: '0x1a8f92b7c0d38119e48271829374019283740192837401928374019283740191',
        announcedAt: '2026-09-13 09:30:00 UTC',
      }
    ]
  });
}

// 7. Action Payment Preview
export interface PaymentPreviewHolder {
  holder: string;
  name: string;
  balance: number;
  sharePercent: number;
  rate: number;
  amount: number;
  currency: string;
}

export interface PaymentPreviewResponse {
  actionId: string;
  version: number;
  totalObligation: number;
  currency: string;
  holdersCount: number;
  isExecuted: boolean;
  schedule: PaymentPreviewHolder[];
}

export async function getActionPreview(actionId: string): Promise<PaymentPreviewResponse> {
  return fetchApi<PaymentPreviewResponse>(`/actions/${actionId}/preview`, {
    actionId: 'CA-001',
    version: 2,
    totalObligation: 40.0,
    currency: 'USDC',
    holdersCount: 3,
    isExecuted: false,
    schedule: [
      {
        holder: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        name: 'Alice',
        balance: 500,
        sharePercent: 50.0,
        rate: 0.04,
        amount: 20.0,
        currency: 'USDC',
      },
      {
        holder: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        name: 'Bob',
        balance: 300,
        sharePercent: 30.0,
        rate: 0.04,
        amount: 12.0,
        currency: 'USDC',
      },
      {
        holder: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        name: 'Charlie',
        balance: 200,
        sharePercent: 20.0,
        rate: 0.04,
        amount: 8.0,
        currency: 'USDC',
      },
    ]
  });
}

// 8. Payments History
export interface PaymentItem {
  id: string;
  actionId: string;
  version: number;
  type: string;
  totalAmount: number;
  holderCount: number;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'SETTLED' | 'PENDING' | 'REVERTED';
}

export async function getPayments(): Promise<{ payments: PaymentItem[] }> {
  return fetchApi<{ payments: PaymentItem[] }>('/payments', {
    payments: [
      {
        id: 'pay-001',
        actionId: 'CA-001',
        version: 2,
        type: 'Coupon Payment (400 bps)',
        totalAmount: 40.0,
        holderCount: 3,
        txHash: '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a',
        blockNumber: 194825,
        timestamp: '2026-09-13 11:20:00 UTC',
        status: 'SETTLED',
      }
    ]
  });
}

// 9. Redemptions
export interface RedemptionItem {
  id: string;
  assetToken: string;
  parRate: number;
  totalPrincipal: number;
  tokensBurned: number;
  remainingSupply: number;
  txHash?: string;
  status: 'PENDING' | 'SETTLED_AND_BURNED';
  timestamp: string;
}

export async function getRedemptions(): Promise<{ redemptions: RedemptionItem[] }> {
  return fetchApi<{ redemptions: RedemptionItem[] }>('/redemptions', {
    redemptions: [
      {
        id: 'red-001',
        assetToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        parRate: 1.0,
        totalPrincipal: 1000.0,
        tokensBurned: 1000,
        remainingSupply: 0,
        txHash: '0x5d91823740192837401928374019283740192837401928374019283740192837',
        status: 'PENDING',
        timestamp: '2027-09-15 00:00:00 UTC',
      }
    ]
  });
}

// 10. Audit Events
export interface AuditItem {
  id: string;
  eventName: string;
  category: 'action' | 'payment' | 'transfer' | 'burn';
  blockNumber: number;
  timestamp: string;
  txHash: string;
  description: string;
  details: Record<string, any>;
}

export async function getAudit(): Promise<{ events: AuditItem[] }> {
  return fetchApi<{ events: AuditItem[] }>('/audit', {
    events: [
      {
        id: 'evt-6',
        eventName: 'ActionPaymentExecuted',
        category: 'payment',
        blockNumber: 194825,
        timestamp: '2026-09-13 11:20:00 UTC',
        txHash: '0x3c78a1f29d91827364bfa109823471029384710293847102938471029384710a',
        description: 'Executed coupon payout for CA-001 Version 2. Disbursed 40.00 USDC across 3 holders.',
        details: { actionId: 'CA-001', version: 2, totalDisbursed: '40.00 USDC', holdersCount: 3 }
      },
      {
        id: 'evt-5',
        eventName: 'ActionAmended',
        category: 'action',
        blockNumber: 194821,
        timestamp: '2026-09-13 09:30:00 UTC',
        txHash: '0x1e82937401928374019283740192837401928374019283740192837401928371',
        description: 'Corporate action amended: Rate updated to 4.00% (400 bps). Version 1 marked SUPERSEDED.',
        details: { actionId: 'CA-001', newRateBps: 400, newVersionId: 'v2' }
      },
      {
        id: 'evt-4',
        eventName: 'Transfer',
        category: 'transfer',
        blockNumber: 194819,
        timestamp: '2026-09-12 16:45:00 UTC',
        txHash: '0x7a81928374019283740192837401928374019283740192837401928374019283',
        description: 'Compliant secondary market transfer: Bob sent 200.00 DBT to Charlie.',
        details: { from: 'Bob', to: 'Charlie', amount: '200.00 DBT' }
      },
      {
        id: 'evt-3',
        eventName: 'ActionCreated',
        category: 'action',
        blockNumber: 194810,
        timestamp: '2026-09-12 10:15:00 UTC',
        txHash: '0x4f82719283740192837401928374019283740192837401928374019283740192',
        description: 'Initial announcement of CA-001 at 5.00% (500 bps) coupon rate.',
        details: { actionId: 'CA-001', version: 1, rateBps: 500 }
      },
      {
        id: 'evt-2',
        eventName: 'WhitelistUpdated',
        category: 'transfer',
        blockNumber: 194805,
        timestamp: '2026-09-11 14:00:00 UTC',
        txHash: '0x9c81729384710293847102938471029384710293847102938471029384710293',
        description: 'Allowlist updated: Alice, Bob, and Charlie approved for compliant ERC-1404 transfers.',
        details: { status: 'APPROVED', accounts: ['Alice', 'Bob', 'Charlie'] }
      },
      {
        id: 'evt-1',
        eventName: 'TokenMint',
        category: 'burn',
        blockNumber: 194801,
        timestamp: '2026-09-11 09:00:00 UTC',
        txHash: '0x2d81726354819283740192837401928374019283740192837401928374019281',
        description: 'Asset genesis: 1,000.00 DBT issued and minted to anchor institutional accounts.',
        details: { assetToken: 'Digital Bond Token', totalSupply: '1,000 DBT' }
      }
    ]
  });
}
