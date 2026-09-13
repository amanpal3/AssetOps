import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer, alice, bob, charlie] = await ethers.getSigners();
  console.log("Seeding demo with account:", deployer.address);

  const manifestPath = path.join(__dirname, "..", "..", "deployments", "hardhat.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Run deploy first to generate deployment manifest.");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const SecToken = await ethers.getContractFactory("SecurityToken");
  const securityToken = SecToken.attach(manifest.contracts.securityToken) as any;

  const PayCurr = await ethers.getContractFactory("PaymentCurrency");
  const paymentCurrency = PayCurr.attach(manifest.contracts.paymentCurrency) as any;

  const Reg = await ethers.getContractFactory("CorporateActionRegistry");
  const registry = Reg.attach(manifest.contracts.corporateActionRegistry) as any;

  // 1. Whitelist holders
  await securityToken.setWhitelisted(alice.address, true);
  await securityToken.setWhitelisted(bob.address, true);
  await securityToken.setWhitelisted(charlie.address, true);
  console.log("Holders whitelisted: Alice, Bob, Charlie");

  // 2. Mint 1,000 DBT (Alice 500, Bob 500)
  await securityToken.mint(alice.address, ethers.parseEther("500"));
  await securityToken.mint(bob.address, ethers.parseEther("500"));
  console.log("Minted 500 DBT to Alice, 500 DBT to Bob");

  // 3. Fund treasury and approve executor
  await paymentCurrency.mint(deployer.address, ethers.parseEther("100000"));
  await paymentCurrency.approve(manifest.contracts.paymentExecutor, ethers.MaxUint256);
  console.log("Treasury funded with 100,000 USDC and approved executor");

  // 4. Create CA-001 v1
  const actionId = ethers.id("CA-001");
  const payableDate = Math.floor(Date.now() / 1000) - 10;
  await registry.createAction(
    actionId,
    manifest.contracts.securityToken,
    0, // COUPON
    500, // 5%
    0,
    payableDate - 100,
    payableDate,
    "ipfs://QmAnnouncementV1"
  );
  console.log("Created CA-001 v1 (5% coupon)");

  // 5. Transfer mid-cycle: Bob -> Charlie 200
  await securityToken.connect(bob).transfer(charlie.address, ethers.parseEther("200"));
  console.log("Bob transferred 200 DBT to Charlie");

  // 6. Amend to v2 (4% coupon)
  await registry.amendAction(
    actionId,
    400, // 4%
    0,
    0,
    "ipfs://QmAnnouncementV2"
  );
  console.log("Amended CA-001 to v2 (4% coupon, v1 superseded)");

  console.log("✅ Canonical demo seeded successfully!");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
});
