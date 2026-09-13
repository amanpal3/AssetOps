import { ethers } from "hardhat";
import {
  ABI_VERSION,
  explorerAddressUrl,
  explorerBaseUrl,
  explorerTxUrl,
  networkNameFor,
  runSepoliaPreflight,
  SEPOLIA_CHAIN_ID,
  writeManifest,
} from "./lib/network";

function role(name: string, contract: string, account: string, description: string) {
  return { name, contract, account, description };
}

async function main() {
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  if (chainId === SEPOLIA_CHAIN_ID) {
    await runSepoliaPreflight();
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const alice = process.env.DEMO_ALICE_ADDRESS || signers[1]?.address;
  const bob = process.env.DEMO_BOB_ADDRESS || signers[2]?.address;
  const charlie = process.env.DEMO_CHARLIE_ADDRESS || signers[3]?.address;
  const treasury = process.env.DEMO_TREASURY_ADDRESS || deployer.address;

  if (!alice || !bob || !charlie) {
    throw new Error("Demo holder addresses are required (local signers or DEMO_*_ADDRESS env vars)");
  }

  console.log("Deployer:", deployer.address);
  console.log("Treasury:", treasury);
  console.log("Holders:", { alice, bob, charlie });

  const txHashes: Record<string, string> = {};

  const PayCurr = await ethers.getContractFactory("PaymentCurrency");
  const paymentCurrency = await PayCurr.deploy("Mock USD Coin", "mUSDC", deployer.address);
  await paymentCurrency.waitForDeployment();
  txHashes.paymentCurrency = paymentCurrency.deploymentTransaction()?.hash || "";
  const payCurrAddress = await paymentCurrency.getAddress();

  const SecToken = await ethers.getContractFactory("SecurityToken");
  const securityToken = await SecToken.deploy("Demo Bond Token", "DBT", deployer.address);
  await securityToken.waitForDeployment();
  txHashes.securityToken = securityToken.deploymentTransaction()?.hash || "";
  const secTokenAddress = await securityToken.getAddress();

  const Reg = await ethers.getContractFactory("CorporateActionRegistry");
  const registry = await Reg.deploy(deployer.address);
  await registry.waitForDeployment();
  txHashes.corporateActionRegistry = registry.deploymentTransaction()?.hash || "";
  const regAddress = await registry.getAddress();

  const Exec = await ethers.getContractFactory("PaymentExecutor");
  const executor = await Exec.deploy(deployer.address, regAddress, payCurrAddress, treasury);
  await executor.waitForDeployment();
  txHashes.paymentExecutor = executor.deploymentTransaction()?.hash || "";
  const execAddress = await executor.getAddress();

  const grantRegistry = await registry.grantRole(await registry.EXECUTOR_ROLE(), execAddress);
  txHashes.grantRegistryExecutor = grantRegistry.hash;
  const grantBurner = await securityToken.grantRole(await securityToken.BURNER_ROLE(), execAddress);
  txHashes.grantTokenBurner = grantBurner.hash;

  const mintPay = await paymentCurrency.mint(treasury, ethers.parseEther("100000"));
  txHashes.mintPaymentCurrency = mintPay.hash;
  if (treasury.toLowerCase() === deployer.address.toLowerCase()) {
    const approve = await paymentCurrency.approve(execAddress, ethers.MaxUint256);
    txHashes.treasuryAllowance = approve.hash;
  } else {
    console.log(
      "Treasury is not the deployer; mint completed. The treasury account must approve PaymentExecutor."
    );
  }

  for (const holder of [alice, bob, charlie]) {
    await (await securityToken.setWhitelisted(holder, true)).wait();
  }
  const mintAlice = await securityToken.mint(alice, ethers.parseEther("500"));
  const mintBob = await securityToken.mint(bob, ethers.parseEther("500"));
  txHashes.mintAlice = mintAlice.hash;
  txHashes.mintBob = mintBob.hash;

  const deploymentBlock = await ethers.provider.getBlockNumber();
  const name = networkNameFor(chainId);
  const explorer = explorerBaseUrl(chainId);

  const manifest = {
    network: name,
    chainId: Number(chainId),
    abiVersion: ABI_VERSION,
    explorerBaseUrl: explorer,
    deploymentBlock,
    contracts: {
      securityToken: secTokenAddress,
      paymentCurrency: payCurrAddress,
      corporateActionRegistry: regAddress,
      paymentExecutor: execAddress,
    },
    constructorParams: {
      securityToken: { name: "Demo Bond Token", symbol: "DBT", admin: deployer.address },
      paymentCurrency: { name: "Mock USD Coin", symbol: "mUSDC", admin: deployer.address },
      corporateActionRegistry: { admin: deployer.address },
      paymentExecutor: {
        admin: deployer.address,
        registry: regAddress,
        paymentCurrency: payCurrAddress,
        treasury,
      },
    },
    roleAssignments: [
      role("DEFAULT_ADMIN_ROLE", "SecurityToken", deployer.address, "Grant and revoke token roles"),
      role("MINTER_ROLE", "SecurityToken", deployer.address, "Mint DBT"),
      role("AGENT_ROLE", "SecurityToken", deployer.address, "Allowlist and pause"),
      role("BURNER_ROLE", "SecurityToken", execAddress, "Authorized redemption burns"),
      role("MINTER_ROLE", "PaymentCurrency", deployer.address, "Mint mock payment currency"),
      role("ANNOUNCER_ROLE", "CorporateActionRegistry", deployer.address, "Create and amend actions"),
      role("EXECUTOR_ROLE", "CorporateActionRegistry", execAddress, "Mark versions executed"),
      role("DEFAULT_ADMIN_ROLE", "PaymentExecutor", deployer.address, "Executor administration"),
      role("EXECUTOR_ROLE", "PaymentExecutor", deployer.address, "Execute payable actions"),
      role("TREASURY_ROLE", "PaymentExecutor", treasury, "Treasury funding source"),
    ],
    demoHolders: { alice, bob, charlie, treasury },
    transactions: txHashes,
    lastUpdated: new Date().toISOString(),
    notes: [
      "PaymentCurrency is mock demo money and is not USD.",
      "Hackathon demo may use one deployer for multiple roles.",
      "Production must split roles and use multisignature governance.",
      "Indexer deduplicates logs by (chainId, transactionHash, logIndex).",
    ],
  };

  writeManifest(manifest, name);

  console.log("\nContract addresses");
  for (const [label, address] of Object.entries(manifest.contracts)) {
    console.log(`  ${label}: ${explorerAddressUrl(chainId, address)}`);
  }
  console.log("\nImportant transactions");
  for (const [label, hash] of Object.entries(txHashes)) {
    if (hash) console.log(`  ${label}: ${explorerTxUrl(chainId, hash)}`);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
