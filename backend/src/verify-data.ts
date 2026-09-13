import { prisma } from './database/prisma.js';

async function main() {
  console.log('=== ASSETS ===');
  console.dir(await prisma.asset.findMany(), { depth: null });
  console.log('=== HOLDERS ===');
  console.dir(await prisma.holder.findMany(), { depth: null });
  console.log('=== CORPORATE ACTIONS & VERSIONS ===');
  console.dir(await prisma.corporateAction.findMany({ include: { versions: true } }), { depth: null });
  console.log('=== TRANSFERS ===');
  console.dir(await prisma.transfer.findMany(), { depth: null });
  console.log('=== AUDIT LOGS ===');
  console.dir(await prisma.auditLog.findMany({ take: 5 }), { depth: null });
  await prisma.$disconnect();
}

main().catch(console.error);
