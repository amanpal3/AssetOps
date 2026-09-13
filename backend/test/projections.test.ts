import test from 'node:test';
import assert from 'node:assert';
import { AssetRepository } from '../src/database/repositories/asset.repository.js';
import { EventHandlers } from '../src/indexer/event-handlers.js';
import { getDatabase } from '../src/database/connection.js';

test('Database Projections - holder balances accurately reflect token state', () => {
  const assetAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const testHolderA = '0x1111111111111111111111111111111111111111';
  const testHolderB = '0x2222222222222222222222222222222222222222';

  // Seed holders
  AssetRepository.upsertHolder(testHolderA, assetAddress, '100', true);
  AssetRepository.upsertHolder(testHolderB, assetAddress, '50', true);

  // Simulate transfer of 25 from A to B
  EventHandlers.handleTransfer(assetAddress, testHolderA, testHolderB, '25');

  // Verify updated balances
  const holders = AssetRepository.getHolders(assetAddress);
  const holderA = holders.find((h: any) => h.address.toLowerCase() === testHolderA.toLowerCase());
  const holderB = holders.find((h: any) => h.address.toLowerCase() === testHolderB.toLowerCase());

  assert.strictEqual(Number(holderA.balance), 75, 'Holder A balance should decrease to 75');
  assert.strictEqual(Number(holderB.balance), 75, 'Holder B balance should increase to 75');

  // Cleanup test holders to keep database pristine for other suites
  getDatabase().prepare('DELETE FROM holders WHERE address IN (?, ?)').run(testHolderA, testHolderB);
});

test('Database Projections - cap table calculation returns balanced distribution', () => {
  const data = AssetRepository.getAllHolders();
  assert.ok(data.holders.length > 0);
  const totalSharePct = data.holders.reduce((sum: number, h: any) => sum + h.sharePercent, 0);
  assert.ok(Math.abs(totalSharePct - 100) < 0.5, 'Cap table share percentages must sum to 100%');
});
