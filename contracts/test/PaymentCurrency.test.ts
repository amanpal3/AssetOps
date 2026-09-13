import { expect } from "chai";
import { ethers } from "hardhat";

describe("PaymentCurrency", function () {
  let paymentCurrency: any;
  let admin: any, user: any;

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    const PaymentCurrencyFactory = await ethers.getContractFactory("PaymentCurrency");
    paymentCurrency = await PaymentCurrencyFactory.deploy("USD Coin", "USDC", admin.address);
    await paymentCurrency.waitForDeployment();
  });

  it("should mint and burn currency", async function () {
    const amount = ethers.parseEther("1000");
    await paymentCurrency.mint(user.address, amount);
    expect(await paymentCurrency.balanceOf(user.address)).to.equal(amount);

    await paymentCurrency.connect(user).burn(ethers.parseEther("400"));
    expect(await paymentCurrency.balanceOf(user.address)).to.equal(ethers.parseEther("600"));
  });
});
