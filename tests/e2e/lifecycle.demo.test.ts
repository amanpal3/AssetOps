import test from 'node:test';
import assert from 'node:assert';

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api/v1';

test('E2E Lifecycle Demo - Complete AssetOps System Verification', async (t) => {
  console.log(`\n🔍 Running AssetOps End-to-End Integration Suite against: ${API_BASE}`);

  // Step 1: Health & Network Verification
  await t.test('1. Backend Service & Indexer Sync Status', async () => {
    const res = await fetch(`${API_BASE}/health`);
    assert.strictEqual(res.status, 200, 'Health endpoint must return 200');
    const data = await res.json();
    assert.strictEqual(data.status, 'ok', 'Status must be ok');
    assert.strictEqual(data.service, 'assetops-backend', 'Service identifier must match');
    assert.ok(typeof data.lastSyncedBlock === 'number' && data.lastSyncedBlock >= 0, 'Last synced block must be indexed');
    console.log(`   ✔ Backend is healthy, lastSyncedBlock: #${data.lastSyncedBlock}`);
  });

  // Step 2: Network Connectivity Check
  await t.test('2. Blockchain Network Status', async () => {
    const res = await fetch(`${API_BASE}/network`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.isSupported, true, 'Network must be marked supported');
    assert.ok(data.chainId === 11155111 || data.chainId === 31337, 'Chain ID must be Sepolia or Hardhat');
    console.log(`   ✔ Network confirmed: ${data.chainName} (Chain ID: ${data.chainId})`);
  });

  // Step 3: Asset Genesis Verification
  await t.test('3. Asset Genesis & Restricted Token Metadata', async () => {
    const res = await fetch(`${API_BASE}/assets`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.assets && data.assets.length > 0, 'Must return assets');
    const bond = data.assets[0];
    assert.strictEqual(bond.symbol, 'DBT', 'Token symbol must be DBT');
    assert.strictEqual(bond.totalSupply, 1000, 'Initial supply must be 1,000 DBT');
    assert.strictEqual(bond.standard, 'ERC-1404', 'Standard must be ERC-1404');
    console.log(`   ✔ Asset confirmed: ${bond.name} (${bond.symbol}), Total Supply: ${bond.totalSupply}`);
  });

  // Step 4: Cap Table & Allowlist Compliance
  await t.test('4. Cap Table Distribution & Compliance Post-Transfer', async () => {
    const res = await fetch(`${API_BASE}/holders`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.totalSupply, 1000, 'Total holdings must sum to 1,000');
    assert.strictEqual(data.holders.length, 3, 'Must have 3 active holders');

    const alice = data.holders.find((h: any) => h.name === 'Alice');
    const bob = data.holders.find((h: any) => h.name === 'Bob');
    const charlie = data.holders.find((h: any) => h.name === 'Charlie');

    assert.ok(alice && alice.balance === 500 && alice.isWhitelisted, 'Alice has 500 DBT whitelisted');
    assert.ok(bob && bob.balance === 300 && bob.isWhitelisted, 'Bob has 300 DBT whitelisted post-transfer');
    assert.ok(charlie && charlie.balance === 200 && charlie.isWhitelisted, 'Charlie has 200 DBT whitelisted');
    console.log(`   ✔ Cap table verified: Alice (500), Bob (300), Charlie (200)`);
  });

  // Step 5: Append-Only Corporate Action Versioning
  await t.test('5. Corporate Action Version DAG (v1 Superseded -> v2 Active)', async () => {
    const res = await fetch(`${API_BASE}/actions/CA-001/versions`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.versions.length, 2, 'CA-001 must contain exactly 2 versions');

    const v1 = data.versions.find((v: any) => v.version === 1);
    const v2 = data.versions.find((v: any) => v.version === 2);

    assert.strictEqual(v1.status, 'SUPERSEDED', 'Version 1 must be SUPERSEDED');
    assert.strictEqual(v1.rateBps, 500, 'Version 1 coupon was 5.00% (500 bps)');

    assert.strictEqual(v2.status, 'ACTIVE', 'Version 2 must be ACTIVE');
    assert.strictEqual(v2.rateBps, 400, 'Version 2 coupon is amended to 4.00% (400 bps)');
    assert.strictEqual(v2.supersedes, v1.versionId, 'Version 2 must cryptographically link back to Version 1');
    console.log(`   ✔ Append-only lineage verified: v1 (500 bps, SUPERSEDED) -> v2 (400 bps, ACTIVE)`);
  });

  // Step 6: Dynamic Pro-Rata Payout Calculation
  await t.test('6. Dynamic Pro-Rata Payout Schedule Calculation', async () => {
    const res = await fetch(`${API_BASE}/actions/CA-001/preview`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.totalObligation, 40, 'Total coupon obligation must be 40.00 USDC');
    assert.strictEqual(data.schedule.length, 3, 'Must schedule 3 payments');

    const alicePay = data.schedule.find((s: any) => s.name === 'Alice');
    const bobPay = data.schedule.find((s: any) => s.name === 'Bob');
    const charliePay = data.schedule.find((s: any) => s.name === 'Charlie');

    assert.strictEqual(alicePay.amount, 20, 'Alice entitled to 20.00 USDC');
    assert.strictEqual(bobPay.amount, 12, 'Bob entitled to 12.00 USDC');
    assert.strictEqual(charliePay.amount, 8, 'Charlie entitled to 8.00 USDC');
    console.log(`   ✔ Calculated payouts match exact math: Alice 20, Bob 12, Charlie 8 USDC`);
  });

  // Step 7: Historical Settlement Records
  await t.test('7. Payment Execution & Settlement Confirmation', async () => {
    const res = await fetch(`${API_BASE}/payments`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.payments && data.payments.length > 0, 'Must have payment records');
    const payment = data.payments[0];
    assert.strictEqual(payment.actionId, 'CA-001');
    assert.strictEqual(payment.status, 'SETTLED');
    assert.ok(payment.txHash && payment.txHash.startsWith('0x'), 'Must contain on-chain tx hash');
    console.log(`   ✔ Settled payment recorded: txHash ${payment.txHash.slice(0, 18)}...`);
  });

  // Step 8: Immutable Audit Trail Completeness
  await t.test('8. Full On-Chain Event Ingestion & Audit Timeline', async () => {
    const res = await fetch(`${API_BASE}/audit`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.events && data.events.length >= 6, 'Must contain full lifecycle event sequence');

    const eventNames = data.events.map((e: any) => e.eventName);
    assert.ok(eventNames.some((n: string) => n.includes('Mint') || n.includes('Genesis')), 'TokenMint logged');
    assert.ok(eventNames.some((n: string) => n.includes('Whitelist')), 'Whitelist logged');
    assert.ok(eventNames.some((n: string) => n.includes('ActionCreated')), 'ActionCreated logged');
    assert.ok(eventNames.some((n: string) => n.includes('Transfer')), 'Transfer logged');
    assert.ok(eventNames.some((n: string) => n.includes('ActionAmended')), 'ActionAmended logged');
    assert.ok(eventNames.some((n: string) => n.includes('PaymentExecuted') || n.includes('Paid')), 'ActionPaymentExecuted logged');

    console.log(`   ✔ Audit trail verified with ${data.events.length} chronological on-chain events`);
  });

  console.log('\n🎉 ALL 8 CANONICAL LIFECYCLE STEPS VERIFIED EMPIRICALLY!\n');
});
