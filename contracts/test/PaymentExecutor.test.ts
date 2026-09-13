import { expect } from "chai";
import { ethers } from "hardhat";

describe("PaymentExecutor", function () {
  let securityToken: any, paymentCurrency: any, registry: any, executor: any;
  let admin: any, treasury: any, alice: any, bob: any;
  const actionId = ethers.id("CA-001");

  beforeEach(async function () {
    [admin, treasury, alice, bob] = await ethers.getSigners();

    const SecToken = await ethers.getContractFactory("SecurityToken");
    securityToken = await SecToken.deploy("Demo Bond Token", "DBT", admin.address);

    const PayCurr = await ethers.getContractFactory("PaymentCurrency");
    paymentCurrency = await PayCurr.deploy("Mock USDC", "USDC", admin.address);

    const Reg = await ethers.getContractFactory("CorporateActionRegistry");
    registry = await Reg.deploy(admin.address);

    const Exec = await ethers.getContractFactory("PaymentExecutor");
    executor = await Exec.deploy(admin.address, await registry.getAddress(), await paymentCurrency.getAddress());

    // Grant executor roles
    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await securityToken.grantRole(await securityToken.BURNER_ROLE(), await executor.getAddress());

    // Whitelist and mint tokens
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.mint(alice.address, ethers.parseEther("500"));

    // Fund treasury and approve executor
    await paymentCurrency.mint(treasury.address, ethers.parseEther("10000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
  });

  it("should execute coupon payment accurately and revert on duplicate replay", async function () {
    const payableDate = Math.floor(Date.now() / 1000) - 10;
    await registry.createAction(
      actionId,
      await securityToken.getAddress(),
      0, // COUPON
      400, // 4%
      0,
      payableDate - 100,
      payableDate,
      "ipfs://QmTest"
    );

    // Initial Alice payment currency balance = 0
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(0);

    // Execute coupon payout: 500 DBT * 4% = 20 USDC
    await executor.executeAction(actionId, treasury.address);
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));

    // Attempt duplicate execution -> MUST REVERT with AlreadyExecuted
    await expect(
      executor.executeAction(actionId, treasury.address)
    ).to.be.revertedWithCustomError(executor, "AlreadyExecuted");
  });
});
