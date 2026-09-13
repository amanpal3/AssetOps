import { expect } from "chai";
import { ethers } from "hardhat";

describe("AssetOps Master Lifecycle Integration Test", function () {
  let securityToken: any, paymentCurrency: any, registry: any, executor: any;
  let admin: any, treasury: any, alice: any, bob: any, charlie: any;
  const actionId = ethers.id("CA-001");
  const redemptionActionId = ethers.id("CA-REDEMPTION-001");

  before(async function () {
    [admin, treasury, alice, bob, charlie] = await ethers.getSigners();

    // 1. Deploy contracts
    const SecToken = await ethers.getContractFactory("SecurityToken");
    securityToken = await SecToken.deploy("Demo Bond Token", "DBT", admin.address);

    const PayCurr = await ethers.getContractFactory("PaymentCurrency");
    paymentCurrency = await PayCurr.deploy("Mock USDC", "USDC", admin.address);

    const Reg = await ethers.getContractFactory("CorporateActionRegistry");
    registry = await Reg.deploy(admin.address);

    const Exec = await ethers.getContractFactory("PaymentExecutor");
    executor = await Exec.deploy(admin.address, await registry.getAddress(), await paymentCurrency.getAddress());

    // 2. Configure roles
    await registry.grantRole(await registry.EXECUTOR_ROLE(), await executor.getAddress());
    await securityToken.grantRole(await securityToken.BURNER_ROLE(), await executor.getAddress());

    // 3. Whitelist holders
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.setWhitelisted(bob.address, true);
    await securityToken.setWhitelisted(charlie.address, true);

    // 4. Mint 1,000 DBT (Alice 500, Bob 500)
    await securityToken.mint(alice.address, ethers.parseEther("500"));
    await securityToken.mint(bob.address, ethers.parseEther("500"));

    // 5. Fund Treasury with 100,000 mock USDC and approve executor
    await paymentCurrency.mint(treasury.address, ethers.parseEther("100000"));
    await paymentCurrency.connect(treasury).approve(await executor.getAddress(), ethers.MaxUint256);
  });

  it("Step 1: Announce CA-001 v1 at 5% coupon", async function () {
    const payableDate = Math.floor(Date.now() / 1000) - 10;
    await registry.createAction(
      actionId,
      await securityToken.getAddress(),
      0, // COUPON
      500, // 5%
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

  it("Step 3: Amend CA-001 to v2 at 4% coupon", async function () {
    await registry.amendAction(
      actionId,
      400, // 4%
      0,
      0,
      "ipfs://QmAnnouncementV2"
    );

    const activeVer = await registry.getActiveVersion(actionId);
    expect(activeVer.version).to.equal(2);
    expect(activeVer.rateBps).to.equal(400);

    const history = await registry.getHistory(actionId);
    expect(history[0].status).to.equal(2); // v1 SUPERSEDED
    expect(history[1].status).to.equal(1); // v2 ACTIVE
  });

  it("Step 4: Execute v2 payout against live holder balances", async function () {
    await executor.executeAction(actionId, treasury.address);

    // Alice: 500 * 4% = 20 USDC
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("20"));
    // Bob: 300 * 4% = 12 USDC
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("12"));
    // Charlie: 200 * 4% = 8 USDC
    expect(await paymentCurrency.balanceOf(charlie.address)).to.equal(ethers.parseEther("8"));
  });

  it("Step 5: Intentional Replay Attack: Duplicate payout MUST revert", async function () {
    await expect(
      executor.executeAction(actionId, treasury.address)
    ).to.be.revertedWithCustomError(executor, "AlreadyExecuted");
  });

  it("Step 6: Maturity Principal Redemption & Token Burn", async function () {
    const payableDate = Math.floor(Date.now() / 1000) - 5;
    // 1 DBT = 1 USDC principal
    await registry.createAction(
      redemptionActionId,
      await securityToken.getAddress(),
      2, // REDEMPTION
      0,
      ethers.parseEther("1"), // 1 USDC per 1 DBT
      payableDate - 10,
      payableDate,
      "ipfs://QmRedemption"
    );

    await executor.executeAction(redemptionActionId, treasury.address);

    // Holders received principal: Alice (+500), Bob (+300), Charlie (+200)
    expect(await paymentCurrency.balanceOf(alice.address)).to.equal(ethers.parseEther("520"));
    expect(await paymentCurrency.balanceOf(bob.address)).to.equal(ethers.parseEther("312"));
    expect(await paymentCurrency.balanceOf(charlie.address)).to.equal(ethers.parseEther("208"));

    // Asset tokens burned: balances and total supply = 0
    expect(await securityToken.balanceOf(alice.address)).to.equal(0);
    expect(await securityToken.balanceOf(bob.address)).to.equal(0);
    expect(await securityToken.balanceOf(charlie.address)).to.equal(0);
    expect(await securityToken.totalSupply()).to.equal(0);
  });
});
