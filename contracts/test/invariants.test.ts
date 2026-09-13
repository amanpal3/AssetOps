import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Lifecycle invariants", function () {
  async function seededFixture() {
    const [admin, treasury, alice, bob] = await ethers.getSigners();
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
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.setWhitelisted(bob.address, true);
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));
    await paymentCurrency.mint(treasury.address, ethers.parseEther("100000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
    return { securityToken, paymentCurrency, registry, executor, treasury, alice, bob };
  }

  it("never mutates Version 1 terms when Version 2 is created", async function () {
    const { registry, securityToken } = await loadFixture(seededFixture);
    const actionId = ethers.id("CA-INV");
    const payableDate = await time.latest();
    await registry.createAction(
      actionId,
      await securityToken.getAddress(),
      0,
      500,
      0,
      payableDate - 1,
      payableDate,
      "ipfs://v1"
    );
    const v1Id = (await registry.getActiveVersion(actionId)).versionId;
    await registry.amendAction(actionId, 400, 0, payableDate, "ipfs://v2");
    const v1 = await registry.getVersion(v1Id);
    expect(v1.rateBps).to.equal(500);
    expect(v1.documentHash).to.equal("ipfs://v1");
    expect(v1.version).to.equal(1);
  });

  it("conserves payment-currency supply across a coupon payout", async function () {
    const { registry, securityToken, paymentCurrency, executor, treasury, alice, bob } =
      await loadFixture(seededFixture);
    const actionId = ethers.id("CA-PAY");
    const payableDate = await time.latest();
    await registry.createAction(
      actionId,
      await securityToken.getAddress(),
      0,
      400,
      0,
      payableDate - 1,
      payableDate,
      "ipfs://pay"
    );
    const supply = await paymentCurrency.totalSupply();
    await executor.executeAction(actionId);
    expect(await paymentCurrency.totalSupply()).to.equal(supply);
    expect(
      (await paymentCurrency.balanceOf(alice.address)) +
        (await paymentCurrency.balanceOf(bob.address)) +
        (await paymentCurrency.balanceOf(treasury.address))
    ).to.equal(supply);
  });
});
