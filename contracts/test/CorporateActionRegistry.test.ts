import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const ACTION = ethers.id("CA-001");

describe("CorporateActionRegistry", function () {
  async function deployFixture() {
    const [admin, announcer, executor, stranger, asset] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("CorporateActionRegistry");
    const registry = await factory.deploy(admin.address);
    await registry.waitForDeployment();
    const ANNOUNCER_ROLE = await registry.ANNOUNCER_ROLE();
    const EXECUTOR_ROLE = await registry.EXECUTOR_ROLE();
    await registry.grantRole(ANNOUNCER_ROLE, announcer.address);
    await registry.grantRole(EXECUTOR_ROLE, executor.address);
    return { registry, admin, announcer, executor, stranger, asset, ANNOUNCER_ROLE, EXECUTOR_ROLE };
  }

  async function createCoupon(registry: any, announcer: any, asset: string, rateBps = 500n) {
    return registry.connect(announcer).createAction(
      ACTION,
      asset,
      0,
      rateBps,
      0,
      1_700_000_000,
      1_700_001_000,
      "ipfs://QmTest1"
    );
  }

  it("creates Version 1 as ACTIVE with coupon terms", async function () {
    const { registry, announcer, asset } = await loadFixture(deployFixture);
    await expect(createCoupon(registry, announcer, asset.address))
      .to.emit(registry, "ActionCreated")
      .and.to.emit(registry, "ActionVersionActivated");

    const active = await registry.getActiveVersion(ACTION);
    expect(active.version).to.equal(1);
    expect(active.rateBps).to.equal(500);
    expect(active.status).to.equal(1);
    expect(active.supersedesVersionId).to.equal(ethers.ZeroHash);
    expect(active.actionType).to.equal(0);
  });

  it("rejects unauthorized action creation", async function () {
    const { registry, stranger, asset, ANNOUNCER_ROLE } = await loadFixture(deployFixture);
    await expect(
      registry.connect(stranger).createAction(ACTION, asset.address, 0, 500, 0, 1, 2, "ipfs://x")
    )
      .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
      .withArgs(stranger.address, ANNOUNCER_ROLE);
  });

  it("amends append-only: v1 stays queryable at 5% SUPERSEDED, v2 is 4% ACTIVE and links back", async function () {
    const { registry, announcer, asset } = await loadFixture(deployFixture);
    await createCoupon(registry, announcer, asset.address);
    const v1 = await registry.getActiveVersion(ACTION);

    await expect(
      registry.connect(announcer).amendAction(ACTION, 400, 0, 1_700_002_000, "ipfs://QmTest2")
    )
      .to.emit(registry, "VersionSuperseded")
      .and.to.emit(registry, "ActionAmended");

    const v1After = await registry.getVersion(v1.versionId);
    expect(v1After.version).to.equal(1);
    expect(v1After.rateBps).to.equal(500);
    expect(v1After.status).to.equal(2);
    expect(v1After.documentHash).to.equal("ipfs://QmTest1");

    const v2 = await registry.getActiveVersion(ACTION);
    expect(v2.version).to.equal(2);
    expect(v2.rateBps).to.equal(400);
    expect(v2.status).to.equal(1);
    expect(v2.supersedesVersionId).to.equal(v1.versionId);
    expect(v2.recordDate).to.equal(v1.recordDate);

    const family = await registry.getAction(ACTION);
    expect(family.activeVersionId).to.equal(v2.versionId);
    expect(await registry.isActiveVersion(ACTION, v1.versionId)).to.equal(false);
    expect(await registry.isActiveVersion(ACTION, v2.versionId)).to.equal(true);

    const history = await registry.getHistory(ACTION);
    expect(history.length).to.equal(2);
    expect(history[0].status).to.equal(2);
    expect(history[1].status).to.equal(1);
  });

  it("rejects duplicate action IDs and unauthorized announcers", async function () {
    const { registry, announcer, stranger, asset, ANNOUNCER_ROLE } = await loadFixture(deployFixture);
    await createCoupon(registry, announcer, asset.address);
    await expect(createCoupon(registry, announcer, asset.address)).to.be.revertedWithCustomError(
      registry,
      "ActionAlreadyExists"
    );
    await expect(
      registry.connect(stranger).amendAction(ACTION, 400, 0, 0, "ipfs://x")
    )
      .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
      .withArgs(stranger.address, ANNOUNCER_ROLE);
  });

  it("rejects invalid coupon and redemption terms", async function () {
    const { registry, announcer, asset } = await loadFixture(deployFixture);
    await expect(
      registry.connect(announcer).createAction(ACTION, asset.address, 0, 0, 0, 1, 2, "ipfs://x")
    ).to.be.revertedWithCustomError(registry, "InvalidActionTerms");
    await expect(
      registry.connect(announcer).createAction(ACTION, asset.address, 0, 400, 1, 1, 2, "ipfs://x")
    ).to.be.revertedWithCustomError(registry, "InvalidActionTerms");
    await expect(
      registry.connect(announcer).createAction(ethers.id("R"), asset.address, 2, 100, ethers.parseEther("1"), 1, 2, "ipfs://x")
    ).to.be.revertedWithCustomError(registry, "InvalidActionTerms");
  });

  it("lets EXECUTOR_ROLE mark only the active version executed and then blocks amendment", async function () {
    const { registry, announcer, executor, stranger, asset, EXECUTOR_ROLE } = await loadFixture(deployFixture);
    await createCoupon(registry, announcer, asset.address);
    await registry.connect(announcer).amendAction(ACTION, 400, 0, 0, "ipfs://v2");
    const v1 = (await registry.getHistory(ACTION))[0];
    const v2 = await registry.getActiveVersion(ACTION);

    await expect(registry.connect(executor).markExecuted(ACTION, v1.versionId))
      .to.be.revertedWithCustomError(registry, "VersionNotCurrent");
    await expect(registry.connect(stranger).markExecuted(ACTION, v2.versionId))
      .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
      .withArgs(stranger.address, EXECUTOR_ROLE);

    await registry.connect(executor).markExecuted(ACTION, v2.versionId);
    expect((await registry.getVersion(v2.versionId)).status).to.equal(3);
    expect((await registry.getAction(ACTION)).status).to.equal(3);
    await expect(registry.connect(announcer).amendAction(ACTION, 300, 0, 0, "ipfs://v3"))
      .to.be.revertedWithCustomError(registry, "ActionAlreadyExecuted");
  });

  it("cancels an active family and blocks later amendment", async function () {
    const { registry, announcer, asset } = await loadFixture(deployFixture);
    await createCoupon(registry, announcer, asset.address);
    await expect(registry.connect(announcer).cancelAction(ACTION)).to.emit(registry, "ActionCancelled");
    expect((await registry.getAction(ACTION)).status).to.equal(4);
    await expect(registry.connect(announcer).amendAction(ACTION, 400, 0, 0, "ipfs://x"))
      .to.be.revertedWithCustomError(registry, "ActionIsCancelled");
  });
});
