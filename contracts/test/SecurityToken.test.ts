import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const ONE = ethers.parseEther("1");
const HUNDRED = ethers.parseEther("100");
const FIFTY = ethers.parseEther("50");

describe("SecurityToken", function () {
  async function deployFixture() {
    const [admin, agent, minter, burner, alice, bob, charlie, stranger] =
      await ethers.getSigners();

    const factory = await ethers.getContractFactory("SecurityToken");
    const token = await factory.deploy("Demo Bond Token", "DBT", admin.address);
    await token.waitForDeployment();

    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const AGENT_ROLE = await token.AGENT_ROLE();
    const BURNER_ROLE = await token.BURNER_ROLE();

    await token.grantRole(AGENT_ROLE, agent.address);
    await token.grantRole(MINTER_ROLE, minter.address);
    await token.grantRole(BURNER_ROLE, burner.address);

    return {
      token,
      admin,
      agent,
      minter,
      burner,
      alice,
      bob,
      charlie,
      stranger,
      DEFAULT_ADMIN_ROLE,
      MINTER_ROLE,
      AGENT_ROLE,
      BURNER_ROLE,
    };
  }

  async function seededHoldersFixture() {
    const ctx = await deployFixture();
    const { token, agent, minter, alice, bob } = ctx;
    await token.connect(agent).setWhitelisted(alice.address, true);
    await token.connect(agent).setWhitelisted(bob.address, true);
    await token.connect(minter).mint(alice.address, HUNDRED);
    return ctx;
  }

  describe("deployment", function () {
    it("sets name, symbol, decimals, zero supply, and admin roles", async function () {
      const { token, admin, DEFAULT_ADMIN_ROLE, MINTER_ROLE, AGENT_ROLE, BURNER_ROLE } =
        await loadFixture(deployFixture);

      expect(await token.name()).to.equal("Demo Bond Token");
      expect(await token.symbol()).to.equal("DBT");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(0n);
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(MINTER_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(AGENT_ROLE, admin.address)).to.be.true;
      expect(await token.hasRole(BURNER_ROLE, admin.address)).to.be.true;
    });

    it("rejects a zero-address admin", async function () {
      const factory = await ethers.getContractFactory("SecurityToken");
      await expect(
        factory.deploy("Demo Bond Token", "DBT", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });
  });

  describe("allowlist", function () {
    it("lets AGENT_ROLE add, query, and remove allowlist status", async function () {
      const { token, agent, alice } = await loadFixture(deployFixture);

      await expect(token.connect(agent).setWhitelisted(alice.address, true))
        .to.emit(token, "WhitelistUpdated")
        .withArgs(alice.address, true);
      expect(await token.isWhitelisted(alice.address)).to.be.true;

      await expect(token.connect(agent).setWhitelisted(alice.address, false))
        .to.emit(token, "WhitelistUpdated")
        .withArgs(alice.address, false);
      expect(await token.isWhitelisted(alice.address)).to.be.false;
    });

    it("rejects allowlist changes from accounts without AGENT_ROLE", async function () {
      const { token, alice, AGENT_ROLE } = await loadFixture(deployFixture);
      await expect(token.connect(alice).setWhitelisted(alice.address, true))
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, AGENT_ROLE);
    });

    it("rejects allowlisting the zero address", async function () {
      const { token, agent } = await loadFixture(deployFixture);
      await expect(
        token.connect(agent).setWhitelisted(ethers.ZeroAddress, true)
      )
        .to.be.revertedWithCustomError(token, "InvalidAddress")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("minting", function () {
    it("lets MINTER_ROLE mint to an allowlisted holder and registers them once", async function () {
      const { token, agent, minter, alice } = await loadFixture(deployFixture);
      await token.connect(agent).setWhitelisted(alice.address, true);

      await expect(token.connect(minter).mint(alice.address, HUNDRED))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, HUNDRED)
        .and.to.emit(token, "TokenMinted")
        .withArgs(alice.address, HUNDRED, HUNDRED)
        .and.to.emit(token, "HolderAdded");

      expect(await token.balanceOf(alice.address)).to.equal(HUNDRED);
      expect(await token.totalSupply()).to.equal(HUNDRED);
      expect(await token.getHolderCount()).to.equal(1n);
      expect(await token.isHolder(alice.address)).to.be.true;

      await token.connect(minter).mint(alice.address, FIFTY);
      expect(await token.getHolderCount()).to.equal(1n);
      expect(await token.totalSupply()).to.equal(HUNDRED + FIFTY);
    });

    it("rejects minting to a non-allowlisted address", async function () {
      const { token, minter, alice } = await loadFixture(deployFixture);
      await expect(token.connect(minter).mint(alice.address, HUNDRED))
        .to.be.revertedWithCustomError(token, "HolderNotWhitelisted")
        .withArgs(alice.address);
      expect(await token.totalSupply()).to.equal(0n);
    });

    it("rejects unauthorized minting", async function () {
      const { token, agent, alice, MINTER_ROLE } = await loadFixture(deployFixture);
      await token.connect(agent).setWhitelisted(alice.address, true);
      await expect(token.connect(alice).mint(alice.address, HUNDRED))
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, MINTER_ROLE);
    });
  });

  describe("transfers", function () {
    it("allows an allowlisted sender to transfer to an allowlisted receiver", async function () {
      const { token, agent, alice, bob } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(alice).transfer(bob.address, FIFTY))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, bob.address, FIFTY)
        .and.to.emit(token, "HolderRegistered")
        .withArgs(bob.address);

      expect(await token.balanceOf(alice.address)).to.equal(FIFTY);
      expect(await token.balanceOf(bob.address)).to.equal(FIFTY);
      expect(await token.totalSupply()).to.equal(HUNDRED);
    });

    it("rejects transfers to a non-allowlisted receiver without changing balances", async function () {
      const { token, alice, charlie } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(alice).transfer(charlie.address, FIFTY))
        .to.be.revertedWithCustomError(token, "ReceiverNotWhitelisted")
        .withArgs(charlie.address);
      expect(await token.balanceOf(alice.address)).to.equal(HUNDRED);
      expect(await token.balanceOf(charlie.address)).to.equal(0n);
    });

    it("rejects transfers from a sender who was removed from the allowlist", async function () {
      const { token, agent, alice, bob } = await loadFixture(seededHoldersFixture);
      await token.connect(agent).setWhitelisted(alice.address, false);
      await expect(token.connect(alice).transfer(bob.address, FIFTY))
        .to.be.revertedWithCustomError(token, "SenderNotWhitelisted")
        .withArgs(alice.address);
      expect(await token.balanceOf(alice.address)).to.equal(HUNDRED);
    });

    it("rejects transfers that exceed the sender balance", async function () {
      const { token, alice, bob } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(alice).transfer(bob.address, HUNDRED + 1n))
        .to.be.revertedWithCustomError(token, "AmountExceedsBalance")
        .withArgs(alice.address, HUNDRED + 1n, HUNDRED);
    });

    it("rejects direct transfers to the zero address so holders cannot self-burn", async function () {
      const { token, alice } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(alice).transfer(ethers.ZeroAddress, FIFTY))
        .to.be.revertedWithCustomError(token, "InvalidAddress")
        .withArgs(ethers.ZeroAddress);
      expect(await token.totalSupply()).to.equal(HUNDRED);
    });
  });

  describe("approvals and transferFrom", function () {
    it("lets an approved spender move tokens between allowlisted accounts", async function () {
      const { token, alice, bob, charlie, agent } = await loadFixture(seededHoldersFixture);
      await token.connect(agent).setWhitelisted(charlie.address, true);
      await expect(token.connect(alice).approve(bob.address, FIFTY))
        .to.emit(token, "Approval")
        .withArgs(alice.address, bob.address, FIFTY);

      await token.connect(bob).transferFrom(alice.address, charlie.address, FIFTY);
      expect(await token.balanceOf(charlie.address)).to.equal(FIFTY);
      expect(await token.allowance(alice.address, bob.address)).to.equal(0n);
    });

    it("enforces allowlist on transferFrom even when the spender is approved", async function () {
      const { token, alice, bob, charlie } = await loadFixture(seededHoldersFixture);
      await token.connect(alice).approve(bob.address, FIFTY);
      await expect(token.connect(bob).transferFrom(alice.address, charlie.address, FIFTY))
        .to.be.revertedWithCustomError(token, "ReceiverNotWhitelisted")
        .withArgs(charlie.address);
    });

    it("rejects transferFrom to the zero address", async function () {
      const { token, alice, bob } = await loadFixture(seededHoldersFixture);
      await token.connect(alice).approve(bob.address, FIFTY);
      await expect(token.connect(bob).transferFrom(alice.address, ethers.ZeroAddress, FIFTY))
        .to.be.revertedWithCustomError(token, "InvalidAddress")
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe("pause", function () {
    it("blocks transfers and minting while paused and restores them after unpause", async function () {
      const { token, agent, minter, alice, bob } = await loadFixture(seededHoldersFixture);

      await expect(token.connect(agent).pause()).to.emit(token, "Paused");
      expect(await token.paused()).to.be.true;
      await expect(token.connect(alice).transfer(bob.address, FIFTY)).to.be.revertedWithCustomError(
        token,
        "TransferPaused"
      );
      await expect(token.connect(minter).mint(alice.address, ONE)).to.be.revertedWithCustomError(
        token,
        "TransferPaused"
      );

      await expect(token.connect(agent).unpause()).to.emit(token, "Unpaused");
      await token.connect(alice).transfer(bob.address, FIFTY);
      expect(await token.balanceOf(bob.address)).to.equal(FIFTY);
    });

    it("rejects pause and unpause from accounts without AGENT_ROLE", async function () {
      const { token, alice, AGENT_ROLE } = await loadFixture(deployFixture);
      await expect(token.connect(alice).pause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, AGENT_ROLE);
      await expect(token.connect(alice).unpause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, AGENT_ROLE);
    });
  });

  describe("holder enumeration", function () {
    it("keeps zero-balance addresses in the monotonic holder list", async function () {
      const { token, burner, alice, bob } = await loadFixture(seededHoldersFixture);
      await token.connect(alice).transfer(bob.address, HUNDRED);

      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.isHolder(alice.address)).to.be.true;
      const holders = await token.getHolders();
      expect(holders).to.include(alice.address);
      expect(holders).to.include(bob.address);

      await token.connect(burner).burnFromHolder(bob.address, HUNDRED);
      expect(await token.isHolder(bob.address)).to.be.true;
      expect(await token.getHolderCount()).to.equal(2n);
    });
  });

  describe("authorized burn", function () {
    it("lets BURNER_ROLE burn a holder balance and reduce total supply", async function () {
      const { token, burner, alice } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(burner).burnFromHolder(alice.address, FIFTY))
        .to.emit(token, "AuthorizedBurn")
        .withArgs(alice.address, FIFTY, FIFTY)
        .and.to.emit(token, "Transfer")
        .withArgs(alice.address, ethers.ZeroAddress, FIFTY);

      expect(await token.balanceOf(alice.address)).to.equal(FIFTY);
      expect(await token.totalSupply()).to.equal(FIFTY);
    });

    it("rejects unauthorized burns", async function () {
      const { token, alice, BURNER_ROLE } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(alice).burnFromHolder(alice.address, FIFTY))
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(alice.address, BURNER_ROLE);
      expect(await token.totalSupply()).to.equal(HUNDRED);
    });

    it("rejects burns above the live holder balance", async function () {
      const { token, burner, alice } = await loadFixture(seededHoldersFixture);
      await expect(token.connect(burner).burnFromHolder(alice.address, HUNDRED + 1n))
        .to.be.revertedWithCustomError(token, "AmountExceedsBalance")
        .withArgs(alice.address, HUNDRED + 1n, HUNDRED);
    });

    it("can burn a delisted holder using live balance only", async function () {
      const { token, agent, burner, alice } = await loadFixture(seededHoldersFixture);
      await token.connect(agent).setWhitelisted(alice.address, false);
      await token.connect(burner).burnFromHolder(alice.address, HUNDRED);
      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  describe("ERC-1404 diagnostics", function () {
    it("returns restriction codes and human-readable messages", async function () {
      const { token, agent, alice, bob, charlie } = await loadFixture(seededHoldersFixture);

      expect(await token.detectTransferRestriction(alice.address, bob.address, FIFTY)).to.equal(0);
      expect(await token.messageForTransferRestriction(0)).to.equal("SUCCESS");

      expect(await token.detectTransferRestriction(charlie.address, bob.address, ONE)).to.equal(1);
      expect(await token.messageForTransferRestriction(1)).to.equal("SENDER_NOT_WHITELISTED");

      expect(await token.detectTransferRestriction(alice.address, charlie.address, ONE)).to.equal(2);
      expect(await token.messageForTransferRestriction(2)).to.equal("RECEIVER_NOT_WHITELISTED");

      await token.connect(agent).pause();
      expect(await token.detectTransferRestriction(alice.address, bob.address, ONE)).to.equal(3);
      expect(await token.messageForTransferRestriction(3)).to.equal("TRANSFERS_PAUSED");
      await token.connect(agent).unpause();

      expect(await token.detectTransferRestriction(alice.address, bob.address, HUNDRED + 1n)).to.equal(
        4
      );
      expect(await token.messageForTransferRestriction(4)).to.equal("INSUFFICIENT_BALANCE");
      expect(await token.messageForTransferRestriction(99)).to.equal("UNKNOWN_RESTRICTION");
    });
  });
});
