import { ethers } from "hardhat";
import { explorerTxUrl, networkNameFor, runSepoliaPreflight, SEPOLIA_CHAIN_ID } from "./lib/network";

/**
 * Canonical demo: 500/500/0 → Bob sends 200 to Charlie → CA-001 v1 5% → v2 4%
 * → pay 20/12/8 → duplicate revert → redeem → total supply 0.
 */
async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId === SEPOLIA_CHAIN_ID) {
    await runSepoliaPreflight();
  }

  const signers = await ethers.getSigners();
  const [deployer, alice, bob, charlie] = signers;
  if (!alice || !bob || !charlie) {
    throw new Error("Need at least four unlocked accounts for the local demo");
  }
  const treasury = deployer;
  console.log("Running AssetOps demo. Deployer:", deployer.address);

  const paymentCurrency = await (await ethers.getContractFactory("PaymentCurrency")).deploy(
    "Mock USD Coin",
    "mUSDC",
    deployer.address
  );
  const securityToken = await (await ethers.getContractFactory("SecurityToken")).deploy(
    "Demo Bond Token",
    "DBT",
    deployer.address
  );
  const registry = await (await ethers.getContractFactory("CorporateActionRegistry")).deploy(
    deployer.address
  );
  const executor = await (await ethers.getContractFactory("PaymentExecutor")).deploy(
    deployer.address,
    await registry.getAddress(),
    await paymentCurrency.getAddress(),
    treasury.address
  );

  await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
  await securityToken.grantRole(await securityToken.BURNER_ROLE(), await executor.getAddress());
  await paymentCurrency.mint(treasury.address, ethers.parseEther("100000"));
  await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);

  for (const holder of [alice, bob, charlie]) {
    await securityToken.setWhitelisted(holder.address, true);
  }
  await securityToken.mint(alice.address, ethers.parseEther("500"));
  await securityToken.mint(bob.address, ethers.parseEther("500"));

  const transfer = await securityToken.connect(bob).transfer(charlie.address, ethers.parseEther("200"));
  console.log("Bob → Charlie 200 DBT", explorerTxUrl(chainId, transfer.hash));

  const actionId = ethers.id("CA-001");
  const payableDate = (await ethers.provider.getBlock("latest"))!.timestamp;
  const v1Tx = await registry.createAction(
    actionId,
    await securityToken.getAddress(),
    0,
    500,
    0,
    payableDate - 100,
    payableDate,
    "ipfs://QmAnnouncementV1"
  );
  console.log("CA-001 Version 1 at 5%", explorerTxUrl(chainId, v1Tx.hash));

  const v1 = await registry.getActiveVersion(actionId);
  const v2Tx = await registry.amendAction(actionId, 400, 0, 0, "ipfs://QmAnnouncementV2");
  console.log("CA-001 Version 2 at 4%", explorerTxUrl(chainId, v2Tx.hash));

  const v1After = await registry.getVersion(v1.versionId);
  const v2 = await registry.getActiveVersion(actionId);
  if (Number(v1After.status) !== 2 || Number(v2.status) !== 1 || v2.rateBps !== 400n) {
    throw new Error("Amendment did not supersede Version 1 and activate Version 2 at 4%");
  }
  console.log("Version 1 is SUPERSEDED; Version 2 is ACTIVE");

  const payTx = await executor.executeAction(actionId);
  console.log("Execute Version 2", explorerTxUrl(chainId, payTx.hash));
  const alicePay = await paymentCurrency.balanceOf(alice.address);
  const bobPay = await paymentCurrency.balanceOf(bob.address);
  const charliePay = await paymentCurrency.balanceOf(charlie.address);
  if (
    alicePay !== ethers.parseEther("20") ||
    bobPay !== ethers.parseEther("12") ||
    charliePay !== ethers.parseEther("8")
  ) {
    throw new Error(`Unexpected coupon payouts: ${alicePay}, ${bobPay}, ${charliePay}`);
  }
  console.log("Payments confirmed: Alice 20, Bob 12, Charlie 8");

  let duplicateRejected = false;
  try {
    await executor.executeAction(actionId);
  } catch (error: unknown) {
    const text = error instanceof Error ? `${error.message} ${error}` : String(error);
    duplicateRejected = text.includes("AlreadyExecuted");
  }
  if (!duplicateRejected) {
    throw new Error("Duplicate execution unexpectedly succeeded");
  }
  console.log("Duplicate execution rejected");

  const redemptionId = ethers.id("CA-REDEMPTION-001");
  const redeemAnnounce = await registry.createAction(
    redemptionId,
    await securityToken.getAddress(),
    2,
    0,
    ethers.parseEther("1"),
    payableDate - 10,
    payableDate,
    "ipfs://QmRedemption"
  );
  console.log("Redemption announced", explorerTxUrl(chainId, redeemAnnounce.hash));
  const redeemTx = await executor.executeRedemption(redemptionId);
  console.log("Redemption executed", explorerTxUrl(chainId, redeemTx.hash));

  if ((await securityToken.totalSupply()) !== 0n) {
    throw new Error("Total supply was not burned to zero");
  }

  console.log("Demo complete. Principal paid, exact DBT balances burned, supply is 0.");
  console.log("Network", networkNameFor(chainId));
}

main().catch((error) => {
  console.error("Local demo failed:", error);
  process.exitCode = 1;
});
