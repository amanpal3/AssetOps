import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PaymentCurrency", function () {
  async function deployFixture() {
    const [admin, treasury, alice, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("PaymentCurrency");
    const token = await factory.deploy("Mock USD Coin", "mUSDC", admin.address);
    await token.waitForDeployment();
    return { token, admin, treasury, alice, stranger };
  }

  it("deploys as a mock ERC-20 with 18 decimals and admin minter", async function () {
    const { token, admin } = await loadFixture(deployFixture);
    expect(await token.name()).to.equal("Mock USD Coin");
    expect(await token.symbol()).to.equal("mUSDC");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(0n);
    expect(await token.hasRole(await token.MINTER_ROLE(), admin.address)).to.be.true;
  });

  it("rejects a zero-address admin", async function () {
    const factory = await ethers.getContractFactory("PaymentCurrency");
    await expect(factory.deploy("Mock USD Coin", "mUSDC", ethers.ZeroAddress)).to.be.revertedWithCustomError(
      factory,
      "InvalidAddress"
    );
  });

  it("lets MINTER_ROLE mint to the treasury for demo funding", async function () {
    const { token, treasury } = await loadFixture(deployFixture);
    const amount = ethers.parseEther("100000");
    await token.mint(treasury.address, amount);
    expect(await token.balanceOf(treasury.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(amount);
  });

  it("rejects unauthorized minting", async function () {
    const { token, alice } = await loadFixture(deployFixture);
    await expect(token.connect(alice).mint(alice.address, 1n)).to.be.revertedWithCustomError(
      token,
      "AccessControlUnauthorizedAccount"
    );
  });

  it("supports unrestricted transfers, allowances, and transferFrom", async function () {
    const { token, treasury, alice } = await loadFixture(deployFixture);
    await token.mint(treasury.address, ethers.parseEther("100"));
    await token.connect(treasury).transfer(alice.address, ethers.parseEther("40"));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("40"));

    await token.connect(alice).approve(treasury.address, ethers.parseEther("10"));
    expect(await token.allowance(alice.address, treasury.address)).to.equal(ethers.parseEther("10"));
    await token.connect(treasury).transferFrom(alice.address, treasury.address, ethers.parseEther("10"));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("30"));
  });

  it("lets a holder burn their own mock currency", async function () {
    const { token, alice } = await loadFixture(deployFixture);
    await token.mint(alice.address, ethers.parseEther("50"));
    await token.connect(alice).burn(ethers.parseEther("20"));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("30"));
  });
});
