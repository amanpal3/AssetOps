import { prisma } from '../database/prisma.js';
import { EventListener } from './event-listener.js';

export async function rebuildDatabase() {
  console.log('🔄 Starting full database rebuild from blockchain events...');

  // 1. Clear existing indexed tables (preserving schema)
  await prisma.auditLog.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.redemptionEvent.deleteMany();
  await prisma.actionVersion.deleteMany();
  await prisma.corporateAction.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.holder.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.processedEvent.deleteMany();
  await prisma.syncCheckpoint.deleteMany();

  console.log('🧹 Indexed read model wiped.');

  // 2. Instantiate EventListener with starting block 0
  const listener = new EventListener();
  await listener.setLastProcessedBlock(0n);
  console.log('⏪ Checkpoint reset to block 0.');

  // 3. Run syncLogs once to catch up to chain head
  await listener.syncLogs();
  const currentBlock = await listener.getLastProcessedBlock();

  console.log(`✅ Database successfully rebuilt up to block ${currentBlock.toString()}!`);
  await prisma.$disconnect();
}

if (process.argv[1]?.includes('rebuild')) {
  rebuildDatabase()
    .catch((err) => {
      console.error('❌ Rebuild failed:', err);
      process.exit(1);
    });
}
