import test from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/database/prisma.js';
import { EventProcessor } from '../src/indexer/event-processor.js';

test('EventProcessor - Deduplication & Idempotency', async (t) => {
  const mockClient = {
    readContract: async () => '0'
  } as any;

  const processor = new EventProcessor(mockClient);
  const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const logIndex = 1;
  const chainId = 31337;
  const blockNumber = 100n;

  t.after(async () => {
    await prisma.processedEvent.deleteMany({
      where: { transactionHash: txHash }
    });
    await prisma.$disconnect();
  });

  await t.test('First event ingestion returns true (processed)', async () => {
    const isNew = await processor.deduplicate(txHash, logIndex, chainId, 'Transfer', blockNumber);
    assert.strictEqual(isNew, true);
  });

  await t.test('Second identical event ingestion returns false (rejected as duplicate)', async () => {
    const isNew = await processor.deduplicate(txHash, logIndex, chainId, 'Transfer', blockNumber);
    assert.strictEqual(isNew, false);
  });
});
