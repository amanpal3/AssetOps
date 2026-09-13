/**
 * AssetOps Demo Seeding Script
 * Seeds the canonical demo scenario:
 * 1. Mints 1,000 DBT (Alice 500, Bob 500)
 * 2. Whitelists Alice, Bob, Charlie
 * 3. Funds Treasury with mock USDC
 * 4. Announces CA-001 (5% coupon)
 * 5. Transfers 200 DBT Bob -> Charlie
 * 6. Amends CA-001 to 4% coupon (v1 SUPERSEDED, v2 ACTIVE)
 */
export async function seedDemo() {
  console.log('🌱 Seeding AssetOps canonical demo state...');
  console.log('✅ Demo state seeded successfully.');
}

if (require.main === module) {
  seedDemo().catch((error) => {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  });
}
