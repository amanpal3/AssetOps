import { expect } from "chai";
import { ethers } from "hardhat";

describe("CorporateActionRegistry", function () {
  let registry: any;
  let admin: any, asset: any;
  const actionId = ethers.id("CA-001");

  beforeEach(async function () {
    [admin, asset] = await ethers.getSigners();
    const RegistryFactory = await ethers.getContractFactory("CorporateActionRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();
  });

  it("should create an active version 1 announcement", async function () {
    const v1Id = await registry.createAction.staticCall(
      actionId,
      asset.address,
      0, // COUPON
      500, // 5%
      0,
      1700000000,
      1700001000,
      "ipfs://QmTest1"
    );

    await registry.createAction(
      actionId,
      asset.address,
      0,
      500,
      0,
      1700000000,
      1700001000,
      "ipfs://QmTest1"
    );

    const activeVer = await registry.getActiveVersion(actionId);
    expect(activeVer.version).to.equal(1);
    expect(activeVer.rateBps).to.equal(500);
    expect(activeVer.status).to.equal(1); // ACTIVE
  });

  it("should amend announcement, marking v1 SUPERSEDED and v2 ACTIVE", async function () {
    await registry.createAction(
      actionId,
      asset.address,
      0,
      500,
      0,
      1700000000,
      1700001000,
      "ipfs://QmTest1"
    );

    await registry.amendAction(
      actionId,
      400, // 4%
      0,
      1700002000,
      "ipfs://QmTest2"
    );

    const activeVer = await registry.getActiveVersion(actionId);
    expect(activeVer.version).to.equal(2);
    expect(activeVer.rateBps).to.equal(400);

    const history = await registry.getHistory(actionId);
    expect(history.length).to.equal(2);
    expect(history[0].status).to.equal(2); // SUPERSEDED
    expect(history[1].status).to.equal(1); // ACTIVE
  });
});
