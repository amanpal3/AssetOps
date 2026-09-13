import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

export const ABI_VERSION = "0.1.0";
export const SEPOLIA_CHAIN_ID = 11155111n;
export const LOCAL_CHAIN_ID = 31337n;

export function networkNameFor(chainId: bigint): string {
  if (chainId === SEPOLIA_CHAIN_ID) return "sepolia";
  if (chainId === LOCAL_CHAIN_ID) return "hardhat";
  return `chain-${chainId.toString()}`;
}

export function explorerBaseUrl(chainId: bigint): string {
  if (chainId === SEPOLIA_CHAIN_ID) return "https://sepolia.etherscan.io";
  return "";
}

export function explorerTxUrl(chainId: bigint, hash: string): string {
  const base = explorerBaseUrl(chainId);
  return base ? `${base}/tx/${hash}` : hash;
}

export function explorerAddressUrl(chainId: bigint, address: string): string {
  const base = explorerBaseUrl(chainId);
  return base ? `${base}/address/${address}` : address;
}

export function rpcHostLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return "(unset)";
  }
}

const PLACEHOLDER_KEYS = new Set([
  "0x0000000000000000000000000000000000000000000000000000000000000000",
  "0x0000000000000000000000000000000000000000000000000000000000000001",
]);

export async function runSepoliaPreflight() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(`Expected Sepolia chain ID ${SEPOLIA_CHAIN_ID}, got ${chainId}`);
  }

  const rpc = process.env.SEPOLIA_RPC_URL || "";
  if (!rpc || rpc.includes("YOUR_ALCHEMY_KEY")) {
    throw new Error("SEPOLIA_RPC_URL must be set to a real RPC endpoint in .env");
  }

  const key = process.env.PRIVATE_KEY || "";
  if (!key || PLACEHOLDER_KEYS.has(key.toLowerCase())) {
    throw new Error("PRIVATE_KEY must be set in .env and must not be a placeholder");
  }

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance === 0n) {
    throw new Error(`Deployer ${deployer.address} has zero Sepolia ETH`);
  }

  console.log("Sepolia preflight OK");
  console.log("  chainId:        ", chainId.toString());
  console.log("  RPC host:       ", rpcHostLabel(rpc));
  console.log("  deployer:       ", deployer.address);
  console.log("  deployer ETH:   ", ethers.formatEther(balance));
  return { deployer, chainId, balance };
}

export function writeManifest(manifest: Record<string, unknown>, networkName: string) {
  const dir = path.join(__dirname, "..", "..", "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const manifestPath = path.join(dir, `${networkName}.json`);
  const serialized = JSON.stringify(manifest, null, 2);
  if (/privateKey|mnemonic|seedPhrase|rpcSecret|apiKey|password/i.test(serialized)) {
    throw new Error("Refusing to write a manifest that appears to contain a secret");
  }
  fs.writeFileSync(manifestPath, serialized);
  console.log(`Manifest written to ${manifestPath}`);
  return manifestPath;
}
