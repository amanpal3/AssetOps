import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

/**
 * Fuzz and invariant coverage for SecurityToken.
 * Live balances and totalSupply are the financial source of truth.
 * The holder list is monotonic and may include zero-balance addresses.
 */
describe("SecurityToken properties", function () {
  async function deployThreeHolders() {
    const [admin, alice, bob, charlie] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("SecurityToken");
    const token = await factory.deploy("Demo Bond Token", "DBT", admin.address);
    await token.waitForDeployment();

    const holders = [alice, bob, charlie];
    for (const holder of holders) {
      await token.setWhitelisted(holder.address, true);
    }
    return { token, admin, alice, bob, charlie, holders };
  }

  async function sumBalances(token: Awaited<ReturnType<typeof deployThreeHolders>>["token"]) {
    const listed = await token.getHolders();
    let sum = 0n;
    for (const addr of listed) {
      sum += await token.balanceOf(addr);
    }
    return sum;
  }

  function mulberry32(seed: number) {
    let t = seed >>> 0;
    return function next() {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  describe("invariants", function () {
    it("conserves totalSupply across mint, transfer, and burn", async function () {
      const { token, alice, bob, charlie } = await loadFixture(deployThreeHolders);
      await token.mint(alice.address, ethers.parseEther("500"));
      await token.mint(bob.address, ethers.parseEther("500"));
      expect(await sumBalances(token)).to.equal(await token.totalSupply());

      await token.connect(bob).transfer(charlie.address, ethers.parseEther("200"));
      expect(await sumBalances(token)).to.equal(await token.totalSupply());
      expect(await token.totalSupply()).to.equal(ethers.parseEther("1000"));

      await token.burnFromHolder(alice.address, ethers.parseEther("500"));
      await token.burnFromHolder(bob.address, ethers.parseEther("300"));
      await token.burnFromHolder(charlie.address, ethers.parseEther("200"));
      expect(await token.totalSupply()).to.equal(0n);
      expect(await sumBalances(token)).to.equal(0n);
      expect(await token.getHolderCount()).to.equal(3n);
    });

    it("never duplicates an address in the holder list", async function () {
      const { token, alice, bob } = await loadFixture(deployThreeHolders);
      await token.mint(alice.address, 10n);
      await token.connect(alice).transfer(bob.address, 4n);
      await token.connect(bob).transfer(alice.address, 2n);
      await token.mint(alice.address, 7n);

      const listed = await token.getHolders();
      expect(new Set(listed.map((a) => a.toLowerCase())).size).to.equal(listed.length);
    });

    it("rejects unauthorized privileged calls without mutating supply", async function () {
      const { token, alice, bob } = await loadFixture(deployThreeHolders);
      await token.mint(alice.address, 100n);
      const supply = await token.totalSupply();

      await expect(token.connect(alice).mint(bob.address, 1n)).to.be.reverted;
      await expect(token.connect(alice).burnFromHolder(alice.address, 1n)).to.be.reverted;
      await expect(token.connect(alice).pause()).to.be.reverted;
      await expect(token.connect(alice).setWhitelisted(bob.address, false)).to.be.reverted;

      expect(await token.totalSupply()).to.equal(supply);
      expect(await token.balanceOf(alice.address)).to.equal(100n);
    });
  });

  describe("fuzz", function () {
    it("random allowlisted transfers preserve supply and never credit a stranger", async function () {
      const { token, alice, bob, charlie, holders } = await loadFixture(deployThreeHolders);
      const stranger = (await ethers.getSigners())[9];
      await token.mint(alice.address, 1_000_000n);

      const rand = mulberry32(13);
      for (let i = 0; i < 64; i++) {
        const from = holders[Math.floor(rand() * holders.length)];
        const to = holders[Math.floor(rand() * holders.length)];
        const fromBal = await token.balanceOf(from.address);
        if (fromBal === 0n) {
          continue;
        }
        const amount = BigInt(Math.floor(rand() * Number(fromBal > 10_000n ? 10_000n : fromBal))) + 1n;
        const capped = amount > fromBal ? fromBal : amount;
        const supplyBefore = await token.totalSupply();
        await token.connect(from).transfer(to.address, capped);
        expect(await token.totalSupply()).to.equal(supplyBefore);
        expect(await token.balanceOf(stranger.address)).to.equal(0n);
      }

      expect(await sumBalances(token)).to.equal(await token.totalSupply());
      expect(await token.isWhitelisted(stranger.address)).to.be.false;
      await expect(token.connect(alice).transfer(stranger.address, 1n)).to.be.revertedWithCustomError(
        token,
        "ReceiverNotWhitelisted"
      );
    });

    it("random oversize transfers always revert and leave balances unchanged", async function () {
      const { token, alice, bob } = await loadFixture(deployThreeHolders);
      await token.mint(alice.address, 500n);
      const rand = mulberry32(99);

      for (let i = 0; i < 32; i++) {
        const extra = BigInt(1 + Math.floor(rand() * 10_000));
        const aliceBefore = await token.balanceOf(alice.address);
        const bobBefore = await token.balanceOf(bob.address);
        await expect(
          token.connect(alice).transfer(bob.address, aliceBefore + extra)
        ).to.be.revertedWithCustomError(token, "AmountExceedsBalance");
        expect(await token.balanceOf(alice.address)).to.equal(aliceBefore);
        expect(await token.balanceOf(bob.address)).to.equal(bobBefore);
      }
    });
  });
});
