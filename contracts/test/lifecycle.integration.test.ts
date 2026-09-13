import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

/**
 * Canonical AssetOps demonstration:
 * Alice 500 / Bob 500 / Charlie 0 → Bob sends 200 to Charlie → CA-001 v2 at 4%.
 * Contract math (floor(balance * 400 / 10_000)):
 *   Alice 20, Bob 12, Charlie 8, total 40.
 */
describe("AssetOps Master Lifecycle Integration Test", function () {
  let securityToken: any;
  let paymentCurrency: any;
  let registry: any;
  let executor: any;
  let admin: any;
  let treasury: any;
  let alice: any;
  let bob: any;
  let charlie: any;
  const actionId = ethers.id("CA-001");
  const redemptionActionId = ethers.id("CA-REDEMPTION-001");

  before(async function () {
    [admin, treasury, alice, bob, charlie] = await ethers.getSigners();

    const SecToken = await ethers.getContractFactory("SecurityToken");
    securityToken = await SecToken.deploy("Demo Bond Token", "DBT", admin.address);

    const PayCurr = await ethers.getContractFactory("PaymentCurrency");
    paymentCurrency = await PayCurr.deploy("Mock USD Coin", "mUSDC", admin.address);

    const Reg = await ethers.getContractFactory("CorporateActionRegistry");
    registry = await Reg.deploy(admin.address);

    const Exec = await ethers.getContractFactory("PaymentExecutor");
    executor = await Exec.deploy(
      admin.address,
      await registry.getAddress(),
      await paymentCurrency.getAddress(),
      treasury.address
    );

    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await securityToken.grantRole(await securityToken.BURNER_ROLE(), await executor.getAddress());

    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.setWhitelisted(bob.address, true);
    await securityToken.setWhitelisted(charlie.address, true);

    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));

    await paymentCurrency.mint(treasury.address, ethers.parseEther("100000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
  });

  it("starts with Alice 500, Bob 500, Charlie 0", async function () {
    expect(await securityToken.balanceOf(alice.address)).to.equal(ethers.parseEther("500"));
    expect(await securityToken.balanceOf(bob.address)).to.equal(ethers.parseEther("500"));
    expect(await securityToken.balanceOf(charlie.address)).to.equal(0);
  });

  it("Step 1: Announce CA-001 v1 at 5% coupon", async function () {
    const payableDate = await time.latest();
    await registry.createAction(
      actionId,
      await securityToken.getAddress(),
      0,
      500,
      0,
      payableDate - 100,
      payableDate,
      "ipfs://QmAnnouncementV1"
    );

    const activeVer = await registry.getActiveVersion(actionId);
    expect(activeVer.version).to.equal(1);
    expect(activeVer.rateBps).to.equal(500);
  });

  it("Step 2: Mid-cycle transfer: Bob transfers 200 DBT to Charlie", async function () {
    await securityToken.connect(bob).transfer(charlie.address, ethers.parseEther("200"));

    expect(await securityToken.balanceOf(alice.address)).to.equal(ethers.parseEther("500"));
    expect(await securityToken.balanceOf(bob.address)).to.equal(ethers.parseEther("300"));
    expect(await securityToken.balanceOf(charlie.address)).to.equal(ethers.parseEther("200"));
  });

  it("Step 3: Amend CA-001 to v2 at 4% coupon without editing Version 1", async function () {
    const v1 = await registry.getActiveVersion(actionId);
    await registry.amendAction(actionId, 400, 0, 0, "ipfs://QmAnnouncementV2");

    const v1After = await registry.getVersion(v1.versionId);
    expect(v1After.rateBps).to.equal(500);
    expect(v1After.status).to.equal(2);

    const activeVer = await registry.getActiveVersion(actionId);
    expect(activeVer.version).to.equal(2);
    expect(activeVer.rateBps).to.equal(400);
    expect(activeVer.supersedesVersionId).to.equal(v1.versionId);

    const history = await registry.getHistory(actionId);
    expect(history[0].status).to.equal(2);
    expect(history[1].status).to.equal(1);
  });

  it("Step 4: Contract calculates v2 payout from live balances (20/12/8 = 40)", async function () {
    const preview = await executor.previewCoupon(actionId);
    expect(preview.total).to.equal(ethers.parseEther("40"));

    await expect(executor.executeAction(actionId))
      .to.emit(executor, "ActionPaymentExecuted")
      .and.to.emit(executor, "HolderPaid");

    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("12"));
    expect(await paymentCurrency.balanceOf(charlie.address)).to.equal(ethers.parseEther("8"));
  });

  it("Step 5: Duplicate execution reverts and does not move further funds", async function () {
    await expect(executor.executeAction(actionId)).to.be.revertedWithCustomError(executor, "AlreadyExecuted");
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("12"));
    expect(await paymentCurrency.balanceOf(charlie.address)).to.equal(ethers.parseEther("8"));
  });

  it("Step 6: Redemption pays principal from live balances and burns exact token amounts", async function () {
    const payableDate = await time.latest();
    await registry.createAction(
      redemptionActionId,
      await securityToken.getAddress(),
      2,
      0,
      ethers.parseEther("1"),
      payableDate - 10,
      payableDate,
      "ipfs://QmRedemption"
    );

    const preview = await executor.previewRedemption(redemptionActionId);
    expect(preview.total).to.equal(ethers.parseEther("1000"));

    await executor.executeAction(redemptionActionId);

    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("520"));
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("312"));
    expect(await paymentCurrency.balanceOf(charlie.address)).to.equal(ethers.parseEther("208"));

    expect(await securityToken.balanceOf(alice.address)).to.equal(0);
    expect(await securityToken.balanceOf(bob.address)).to.equal(0);
    expect(await securityToken.balanceOf(charlie.address)).to.equal(0);
    expect(await securityToken.totalSupply()).to.equal(0);
  });
});
