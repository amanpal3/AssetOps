import test from 'node:test';
import assert from 'node:assert';

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api/v1';

test('API Routes - health and network endpoints return valid status', async () => {
  const healthRes = await fetch(`${API_BASE}/health`);
  assert.strictEqual(healthRes.status, 200);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ok');
  assert.strictEqual(health.service, 'assetops-backend');

  const networkRes = await fetch(`${API_BASE}/network`);
  assert.strictEqual(networkRes.status, 200);
  const network = await networkRes.json();
  assert.strictEqual(network.isSupported, true);
});

test('API Routes - assets and holders endpoints return populated read models', async () => {
  const assetsRes = await fetch(`${API_BASE}/assets`);
  assert.strictEqual(assetsRes.status, 200);
  const assetsData = await assetsRes.json();
  assert.ok(Array.isArray(assetsData.assets) && assetsData.assets.length > 0);
  assert.strictEqual(assetsData.assets[0].symbol, 'DBT');

  const holdersRes = await fetch(`${API_BASE}/holders`);
  assert.strictEqual(holdersRes.status, 200);
  const holdersData = await holdersRes.json();
  assert.strictEqual(holdersData.totalSupply, 1000);
  assert.strictEqual(holdersData.holders.length, 3);
});

test('API Routes - corporate action endpoints return append-only DAG', async () => {
  const actionsRes = await fetch(`${API_BASE}/actions`);
  assert.strictEqual(actionsRes.status, 200);
  const actionsData = await actionsRes.json();
  assert.ok(actionsData.actions.length > 0);

  const versionsRes = await fetch(`${API_BASE}/actions/CA-001/versions`);
  assert.strictEqual(versionsRes.status, 200);
  const versionsData = await versionsRes.json();
  assert.strictEqual(versionsData.versions.length, 2);

  const previewRes = await fetch(`${API_BASE}/actions/CA-001/preview`);
  assert.strictEqual(previewRes.status, 200);
  const preview = await previewRes.json();
  assert.strictEqual(preview.totalObligation, 40);
  assert.strictEqual(preview.schedule.length, 3);
});

test('API Routes - redemptions endpoint returns scheduled liquidation details', async () => {
  const redemptionsRes = await fetch(`${API_BASE}/redemptions`);
  assert.strictEqual(redemptionsRes.status, 200);
  const data = await redemptionsRes.json();
  assert.ok(Array.isArray(data.redemptions) && data.redemptions.length > 0);
  const redemption = data.redemptions[0];
  assert.strictEqual(redemption.parRate, 1.0);
  assert.strictEqual(redemption.totalPrincipal, 1000.0);
  assert.strictEqual(redemption.remainingSupply, 0);
  assert.strictEqual(redemption.tokensBurned, 1000);
});

