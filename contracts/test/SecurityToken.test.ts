import { expect } from "chai";
import { ethers } from "hardhat";

describe("SecurityToken", function () {
  let securityToken: any;
  let admin: any, alice: any, bob: any, charlie: any;

  beforeEach(async function () {
    [admin, alice, bob, charlie] = await ethers.getSigners();
    const SecurityTokenFactory = await ethers.getContractFactory("SecurityToken");
    securityToken = await SecurityTokenFactory.deploy("Demo Bond Token", "DBT", admin.address);
    await securityToken.waitForDeployment();
  });

  it("should deploy with correct initial state and roles", async function () {
    expect(await securityToken.name()).to.equal("Demo Bond Token");
    expect(await securityToken.symbol()).to.equal("DBT");
    expect(await securityToken.hasRole(await securityToken.MINTER_ROLE(), admin.address)).to.be.true;
  });

  it("should enforce allowlist on mint and transfer", async function () {
    const mintAmount = ethers.parseEther("100");

    // Mint to non-whitelisted fails
    await expect(securityToken.mint(alice.address, mintAmount))
      .to.be.revertedWithCustomError(securityToken, "ReceiverNotWhitelisted");

    // Whitelist alice and mint
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.mint(alice.address, mintAmount);
    expect(await securityToken.balanceOf(alice.address)).to.equal(mintAmount);

    // Transfer to non-whitelisted bob fails
    await expect(securityToken.connect(alice).transfer(bob.address, ethers.parseEther("50")))
      .to.be.revertedWithCustomError(securityToken, "ReceiverNotWhitelisted");

    // Whitelist bob and transfer succeeds
    await securityToken.setWhitelisted(bob.address, true);
    await securityToken.connect(alice).transfer(bob.address, ethers.parseEther("50"));
    expect(await securityToken.balanceOf(bob.address)).to.equal(ethers.parseEther("50"));
  });

  it("should track holders monotonically", async function () {
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.setWhitelisted(bob.address, true);

    await securityToken.mint(alice.address, ethers.parseEther("100"));
    await securityToken.mint(bob.address, ethers.parseEther("50"));

    const holders = await securityToken.getHolders();
    expect(holders).to.include(alice.address);
    expect(holders).to.include(bob.address);
  });

  it("should allow burner role to burn tokens", async function () {
    await securityToken.setWhitelisted(alice.address, true);
    await securityToken.mint(alice.address, ethers.parseEther("100"));

    await securityToken.burnFromHolder(alice.address, ethers.parseEther("40"));
    expect(await securityToken.balanceOf(alice.address)).to.equal(ethers.parseEther("60"));
  });
});
