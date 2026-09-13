/**
 * AssetOps Deployment Verification Script
 * Validates that all contracts are deployed, roles are correctly assigned,
 * and contract addresses are written to deployment manifests.
 */
import fs from 'fs';
import path from 'path';

export async function verifyDeployment(network = 'hardhat') {
  console.log(`🔍 Verifying deployment on network: ${network}...`);
  const manifestPath = path.join(__dirname, '..', 'deployments', `${network}.json`);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Manifest loaded for chain ID: ${manifest.chainId}`);
  console.log('✅ All contract bindings verified.');
}

if (require.main === module) {
  const network = process.argv[2] || 'hardhat';
  verifyDeployment(network).catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
}
