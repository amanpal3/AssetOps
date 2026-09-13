import test from 'node:test';
import assert from 'node:assert';
import { app } from '../src/server.js';
import { prisma } from '../src/database/prisma.js';
import http from 'node:http';

test('Backend API - Member 1 Endpoints Verification', async (t) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}/api/v1`;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  });

  await t.test('GET /api/v1/health returns 200 and ok status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'assetops-backend');
    assert.ok(data.timestamp);
  });

  await t.test('GET /api/v1/network returns network config', async () => {
    const res = await fetch(`${baseUrl}/network`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.network);
    assert.ok(data.chainId);
  });

  await t.test('GET /api/v1/assets returns asset array', async () => {
    const res = await fetch(`${baseUrl}/assets`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.assets));
  });

  await t.test('GET /api/v1/holders returns holders list', async () => {
    const res = await fetch(`${baseUrl}/holders`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.holders));
    assert.strictEqual(typeof data.count, 'number');
  });

  await t.test('GET /api/v1/actions returns actions list', async () => {
    const res = await fetch(`${baseUrl}/actions`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.actions));
  });

  await t.test('GET /api/v1/payments returns payments list', async () => {
    const res = await fetch(`${baseUrl}/payments`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.payments));
  });

  await t.test('GET /api/v1/redemptions returns redemptions list', async () => {
    const res = await fetch(`${baseUrl}/redemptions`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.redemptions));
  });

  await t.test('GET /api/v1/audit returns audit log array', async () => {
    const res = await fetch(`${baseUrl}/audit`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.auditLogs));
  });
});
