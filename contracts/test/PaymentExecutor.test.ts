import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const CA001 = ethers.id("CA-001");
const CA_INT = ethers.id("CA-INT");
const CA_RED = ethers.id("CA-RED");

describe("PaymentExecutor", function () {
  async function deployFixture() {
    const [admin, treasury, alice, bob, charlie, stranger] = await ethers.getSigners();

    const securityToken = await (await ethers.getContractFactory("SecurityToken")).deploy(
      "Demo Bond Token",
      "DBT",
      admin.address
    );
    const paymentCurrency = await (await ethers.getContractFactory("PaymentCurrency")).deploy(
      "Mock USD Coin",
      "mUSDC",
      admin.address
    );
    const registry = await (await ethers.getContractFactory("CorporateActionRegistry")).deploy(admin.address);
    const executor = await (await ethers.getContractFactory("PaymentExecutor")).deploy(
      admin.address,
      await registry.getAddress(),
      await paymentCurrency.getAddress(),
      treasury.address
    );

    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await securityToken.grantRole(await securityToken.BURNER_ROLE(), await executor.getAddress());
    for (const holder of [alice, bob, charlie]) {
      await securityToken.setWhitelisted(holder.address, true);
    }

    return {
      securityToken,
      paymentCurrency,
      registry,
      executor,
      admin,
      treasury,
      alice,
      bob,
      charlie,
      stranger,
    };
  }

  async function fundTreasury(paymentCurrency: any, treasury: any, executor: any, amount = ethers.parseEther("10000")) {
    await paymentCurrency.mint(treasury.address, amount);
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
  }

  async function createRateAction(
    registry: any,
    asset: string,
    actionId: string,
    actionType: number,
    rateBps: bigint
  ) {
    const payableDate = await time.latest();
    await registry.createAction(
      actionId,
      asset,
      actionType,
      rateBps,
      0,
      payableDate - 100,
      payableDate,
      "ipfs://terms"
    );
  }

  it("coupon execution pays the correct amount from live balances", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);

    await expect(executor.executeCoupon(CA001)).to.emit(executor, "ActionExecutionStarted");
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));
  });

  it("interest execution pays the correct amount", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    await createRateAction(registry, await securityToken.getAddress(), CA_INT, 1, 400n);

    await executor.executeInterest(CA_INT);
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));
  });

  it("uses live balances after a transfer: Alice 20, Bob 12, Charlie 8", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice, bob, charlie } =
      await loadFixture(deployFixture);

    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));
    await securityToken.connect(bob).transfer(charlie.address, ethers.parseEther("200"));
    await fundTreasury(paymentCurrency, treasury, executor);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);

    await executor.executeAction(CA001);
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("12"));
    expect(await paymentCurrency.balanceOf(charlie.address)).to.equal(ethers.parseEther("8"));
  });

  it("duplicate execution reverts", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);
    await executor.executeAction(CA001);
    await expect(executor.executeAction(CA001)).to.be.revertedWithCustomError(executor, "AlreadyExecuted");
  });

  it("wrong action type reverts", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);
    await expect(executor.executeRedemption(CA001)).to.be.revertedWithCustomError(
      executor,
      "UnsupportedActionType"
    );
  });

  it("inactive and cancelled versions cannot execute", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);
    await registry.cancelAction(CA001);
    await expect(executor.executeAction(CA001)).to.be.revertedWithCustomError(executor, "ActionNotActive");
  });

  it("superseded and inactive versions revert", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    const payableDate = await time.latest();
    await registry.createAction(
      CA001,
      await securityToken.getAddress(),
      0,
      500,
      0,
      payableDate - 10,
      payableDate,
      "ipfs://v1"
    );
    const v1 = await registry.getActiveVersion(CA001);
    await registry.amendAction(CA001, 400, 0, payableDate, "ipfs://v2");
    await expect(executor.executeVersion(CA001, v1.versionId)).to.be.revertedWithCustomError(
      executor,
      "SupersededVersion"
    );
  });

  it("before-payable-date execution reverts", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice, stranger } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    const future = (await time.latest()) + 3600;
    await registry.createAction(
      CA001,
      await securityToken.getAddress(),
      0,
      400,
      0,
      future - 10,
      future,
      "ipfs://later"
    );
    await expect(executor.executeAction(CA001)).to.be.revertedWithCustomError(executor, "NotPayableYet");
    await expect(executor.connect(stranger).executeAction(CA001)).to.be.revertedWithCustomError(
      executor,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("insufficient treasury balance and allowance revert without locking the action", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);

    await expect(executor.executeAction(CA001)).to.be.revertedWithCustomError(
      executor,
      "InsufficientTreasuryBalance"
    );
    await paymentCurrency.mint(treasury.address, ethers.parseEther("10000"));
    await expect(executor.executeAction(CA001)).to.be.revertedWithCustomError(
      executor,
      "InsufficientTreasuryAllowance"
    );
    const active = await registry.getActiveVersion(CA001);
    expect(active.status).to.equal(1);
    expect(await executor.isExecuted(CA001, active.versionId)).to.equal(false);
  });

  it("a failed holder payment reverts all payments", async function () {
    const [admin, treasury, alice, bob] = await ethers.getSigners();
    const securityToken = await (await ethers.getContractFactory("SecurityToken")).deploy(
      "Demo Bond Token",
      "DBT",
      admin.address
    );
    const paymentCurrency = await (await ethers.getContractFactory("FailingPaymentCurrency")).deploy(1);
    const registry = await (await ethers.getContractFactory("CorporateActionRegistry")).deploy(admin.address);
    const executor = await (await ethers.getContractFactory("PaymentExecutor")).deploy(
      admin.address,
      await registry.getAddress(),
      await paymentCurrency.getAddress(),
      treasury.address
    );
    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.setWhitelisted(bob.address, true);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));
    await paymentCurrency.mint(treasury.address, ethers.parseEther("10000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);

    await expect(executor.executeAction(CA001)).to.be.revertedWithCustomError(
      paymentCurrency,
      "TransferFromFailed"
    );
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(0);
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(0);
    expect((await registry.getActiveVersion(CA001)).status).to.equal(1);
  });

  it("a failed burn reverts all payments and burns", async function () {
    const [admin, treasury, alice, bob] = await ethers.getSigners();
    const securityToken = await (await ethers.getContractFactory("FailingBurnSecurityToken")).deploy(
      admin.address,
      1
    );
    const paymentCurrency = await (await ethers.getContractFactory("PaymentCurrency")).deploy(
      "Mock USD Coin",
      "mUSDC",
      admin.address
    );
    const registry = await (await ethers.getContractFactory("CorporateActionRegistry")).deploy(admin.address);
    const executor = await (await ethers.getContractFactory("PaymentExecutor")).deploy(
      admin.address,
      await registry.getAddress(),
      await paymentCurrency.getAddress(),
      treasury.address
    );
    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await securityToken.grantRole(await securityToken.BURNER_ROLE(), await executor.getAddress());
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.setWhitelisted(bob.address, true);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));
    await paymentCurrency.mint(treasury.address, ethers.parseEther("10000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);

    const payableDate = await time.latest();
    await registry.createAction(
      CA_RED,
      await securityToken.getAddress(),
      2,
      0,
      ethers.parseEther("1"),
      payableDate - 10,
      payableDate,
      "ipfs://red"
    );

    await expect(executor.executeRedemption(CA_RED)).to.be.revertedWithCustomError(securityToken, "BurnBoom");
    expect(await securityToken.totalSupply()).to.equal(ethers.parseEther("1000"));
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(0);
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(0);
  });

  it("blocks a reentrancy attempt during payout", async function () {
    const [admin, treasury, alice] = await ethers.getSigners();
    const securityToken = await (await ethers.getContractFactory("SecurityToken")).deploy(
      "Demo Bond Token",
      "DBT",
      admin.address
    );
    const paymentCurrency = await (await ethers.getContractFactory("ReentrantPaymentCurrency")).deploy();
    const registry = await (await ethers.getContractFactory("CorporateActionRegistry")).deploy(admin.address);
    const executor = await (await ethers.getContractFactory("PaymentExecutor")).deploy(
      admin.address,
      await registry.getAddress(),
      await paymentCurrency.getAddress(),
      treasury.address
    );
    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await executor.grantRole(await executor.EXECUTOR_ROLE(), await paymentCurrency.getAddress());
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await paymentCurrency.mint(treasury.address, ethers.parseEther("10000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
    await createRateAction(registry, await securityToken.getAddress(), CA001, 0, 400n);
    await paymentCurrency.setAttack(await executor.getAddress(), CA001);

    await expect(executor.executeAction(CA001)).to.be.reverted;
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(0);
    expect((await registry.getActiveVersion(CA001)).status).to.equal(1);
  });

  it("redemption pays principal, burns exact balances, and zeroes total supply", async function () {
    const { securityToken, paymentCurrency, registry, executor, treasury, alice, bob } =
      await loadFixture(deployFixture);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));
    await fundTreasury(paymentCurrency, treasury, executor);
    const payableDate = await time.latest();
    await registry.createAction(
      CA_RED,
      await securityToken.getAddress(),
      2,
      0,
      ethers.parseEther("1"),
      payableDate - 10,
      payableDate,
      "ipfs://red"
    );

    await expect(executor.executeRedemption(CA_RED)).to.emit(executor, "RedemptionExecuted");
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("500"));
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("500"));
    expect(await securityToken.balanceOf(alice.address)).to.equal(0);
    expect(await securityToken.balanceOf(bob.address)).to.equal(0);
    expect(await securityToken.totalSupply()).to.equal(0);
  });
});
