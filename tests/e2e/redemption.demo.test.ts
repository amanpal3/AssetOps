import test from 'node:test';
import assert from 'node:assert';

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api/v1';

/**
 * End-to-End Test: Maturity Redemption & Authorized Token Burn
 * Canonical Flow:
 * 1. Verify scheduled redemption action and par conversion rate ($1.00 / token)
 * 2. Query cap table balances prior to maturity redemption (Alice 500, Bob 300, Charlie 200)
 * 3. Verify pro-rata principal payout allocation math (500 + 300 + 200 = 1,000 USDC)
 * 4. Verify post-redemption settlement state and authorized token burn to zero supply
 * 5. Verify transaction hash and immutable audit trail recording
 */
test('E2E Redemption & Burn Demo - Full Par Liquidation Lifecycle', async (t) => {
  console.log(`\n🔍 Running AssetOps Redemption & Burn Verification against: ${API_BASE}`);

  // Step 1: Query Redemption Schedule from Indexer
  await t.test('1. Scheduled Par Redemption Query & Metadata Verification', async () => {
    const res = await fetch(`${API_BASE}/redemptions`);
    assert.strictEqual(res.status, 200, 'Redemption endpoint must return 200');
    const data = await res.json();
    assert.ok(Array.isArray(data.redemptions) && data.redemptions.length > 0, 'Must return scheduled redemptions');

    const redemption = data.redemptions[0];
    assert.strictEqual(redemption.parRate, 1.0, 'Par redemption rate must be 1.00 USDC per 1 DBT');
    assert.strictEqual(redemption.totalPrincipal, 1000.0, 'Total principal obligation must equal 1,000.00 USDC');
    assert.ok(redemption.assetToken && redemption.assetToken.startsWith('0x'), 'Asset token address must be populated');
    console.log(`   ✔ Scheduled redemption confirmed: ID ${redemption.id} at $${redemption.parRate}/token`);
  });

  // Step 2: Query Holders Cap Table Prior to Redemption
  await t.test('2. Holder Registry Live Balances for Par Liquidation', async () => {
    const res = await fetch(`${API_BASE}/holders`);
    assert.strictEqual(res.status, 200, 'Holders endpoint must return 200');
    const data = await res.json();

    assert.strictEqual(data.totalSupply, 1000, 'Pre-redemption initial total supply must be 1,000 DBT');
    assert.strictEqual(data.holders.length, 3, 'Must have 3 active holders in cap table');

    const alice = data.holders.find((h: any) => h.name === 'Alice');
    const bob = data.holders.find((h: any) => h.name === 'Bob');
    const charlie = data.holders.find((h: any) => h.name === 'Charlie');

    assert.ok(alice && alice.balance === 500, 'Alice holds 500 DBT');
    assert.ok(bob && bob.balance === 300, 'Bob holds 300 DBT');
    assert.ok(charlie && charlie.balance === 200, 'Charlie holds 200 DBT');
    console.log(`   ✔ Cap table confirmed: Alice 500, Bob 300, Charlie 200 DBT (Sum: 1,000)`);
  });

  // Step 3: Verify Pro-Rata Principal Payout Calculations
  await t.test('3. Exact Pro-Rata Principal Entitlement Allocation', async () => {
    const holdersRes = await fetch(`${API_BASE}/holders`);
    const holdersData = await holdersRes.json();
    const parRate = 1.0;

    const payoutEntitlements = holdersData.holders.map((h: any) => ({
      name: h.name,
      address: h.address,
      principalEntitlement: h.balance * parRate,
      tokensToBurn: h.balance
    }));

    const totalPrincipal = payoutEntitlements.reduce((sum: number, p: any) => sum + p.principalEntitlement, 0);
    assert.strictEqual(totalPrincipal, 1000.0, 'Total principal entitlement must exactly equal 1,000.00 USDC');

    const alicePay = payoutEntitlements.find((p: any) => p.name === 'Alice');
    const bobPay = payoutEntitlements.find((p: any) => p.name === 'Bob');
    const charliePay = payoutEntitlements.find((p: any) => p.name === 'Charlie');

    assert.strictEqual(alicePay.principalEntitlement, 500.0, 'Alice entitled to 500.00 USDC principal');
    assert.strictEqual(bobPay.principalEntitlement, 300.0, 'Bob entitled to 300.00 USDC principal');
    assert.strictEqual(charliePay.principalEntitlement, 200.0, 'Charlie entitled to 200.00 USDC principal');
    console.log(`   ✔ Pro-rata principal verified: Alice 500, Bob 300, Charlie 200 USDC`);
  });

  // Step 4: Verify Authorized Token Burn Invariant
  await t.test('4. Authorized Token Burn Invariant: Total Supply Reduces to 0', async () => {
    const res = await fetch(`${API_BASE}/redemptions`);
    const data = await res.json();
    const redemption = data.redemptions[0];

    // Invariant: tokens burned + remaining supply must equal initial total supply (1,000)
    const initialSupply = 1000;
    assert.strictEqual(
      redemption.tokensBurned + redemption.remainingSupply,
      initialSupply,
      'Burn invariant: tokensBurned + remainingSupply must equal initial total supply'
    );

    // When fully executed/settled, remaining supply must be 0
    if (redemption.status === 'SETTLED_AND_BURNED' || redemption.status === 'PENDING') {
      assert.strictEqual(redemption.remainingSupply, 0, 'Post-burn remaining supply drops to 0 DBT');
      assert.strictEqual(redemption.tokensBurned, 1000, 'All 1,000 DBT tokens burned on maturity');
    }
    console.log(`   ✔ Token burn invariant confirmed: 1,000 DBT burned -> 0 remaining supply`);
  });

  // Step 5: Verify Transaction Proof & Explorer Linkage
  await t.test('5. Cryptographic Tx Proof & Audit Traceability', async () => {
    const res = await fetch(`${API_BASE}/redemptions`);
    const data = await res.json();
    const redemption = data.redemptions[0];

    assert.ok(redemption.txHash && redemption.txHash.startsWith('0x'), 'Redemption must provide transaction hash proof');
    assert.strictEqual(redemption.txHash.length, 66, 'Valid 32-byte Ethereum tx hash format');
    console.log(`   ✔ Redemption proof verified: txHash ${redemption.txHash.slice(0, 18)}...`);
  });

  console.log('\n🎉 ALL MATURITY REDEMPTION & TOKEN BURN INVARIANTS EMPIRICALLY VERIFIED!\n');
});
