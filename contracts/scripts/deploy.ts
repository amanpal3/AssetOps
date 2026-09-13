import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AssetOps contracts with account:", deployer.address);

  // 1. Deploy PaymentCurrency
  const PayCurr = await ethers.getContractFactory("PaymentCurrency");
  const paymentCurrency = await PayCurr.deploy("USD Coin", "USDC", deployer.address);
  await paymentCurrency.waitForDeployment();
  const payCurrAddress = await paymentCurrency.getAddress();
  console.log("PaymentCurrency deployed to:", payCurrAddress);

  // 2. Deploy SecurityToken
  const SecToken = await ethers.getContractFactory("SecurityToken");
  const securityToken = await SecToken.deploy("Demo Bond Token", "DBT", deployer.address);
  await securityToken.waitForDeployment();
  const secTokenAddress = await securityToken.getAddress();
  console.log("SecurityToken deployed to:", secTokenAddress);

  // 3. Deploy CorporateActionRegistry
  const Reg = await ethers.getContractFactory("CorporateActionRegistry");
  const registry = await Reg.deploy(deployer.address);
  await registry.waitForDeployment();
  const regAddress = await registry.getAddress();
  console.log("CorporateActionRegistry deployed to:", regAddress);

  // 4. Deploy PaymentExecutor
  const Exec = await ethers.getContractFactory("PaymentExecutor");
  const executor = await Exec.deploy(deployer.address, regAddress, payCurrAddress);
  await executor.waitForDeployment();
  const execAddress = await executor.getAddress();
  console.log("PaymentExecutor deployed to:", execAddress);

  // 5. Grant roles
  await registry.grantRole(await registry.EXECUTOR_ROLE(), execAddress);
  await securityToken.grantRole(await securityToken.BURNER_ROLE(), execAddress);
  console.log("Roles granted successfully.");

  // 6. Write deployment artifact to deployments/
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === 11155111n ? "sepolia" : "hardhat";
  const manifestPath = path.join(__dirname, "..", "..", "deployments", `${networkName}.json`);

  const manifest = {
    network: networkName,
    chainId: Number(network.chainId),
    contracts: {
      securityToken: secTokenAddress,
      paymentCurrency: payCurrAddress,
      corporateActionRegistry: regAddress,
      paymentExecutor: execAddress
    },
    deploymentBlock: await ethers.provider.getBlockNumber(),
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
