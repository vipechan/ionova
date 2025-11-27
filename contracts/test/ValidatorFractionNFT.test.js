const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ValidatorFractionNFT", function () {
    let contract;
    let usdc;
    let ionx;
    let owner;
    let buyer1;
    let buyer2;
    let treasury;
    let kycAdmin;

    const USDC_DECIMALS = 6;
    const IONX_DECIMALS = 18;
    const START_PRICE = 10 * 10 ** USDC_DECIMALS; // $10
    const END_PRICE = 100 * 10 ** USDC_DECIMALS; // $100
    const TOTAL_FRACTIONS = 1_800_000;

    beforeEach(async function () {
        [owner, buyer1, buyer2, treasury, kycAdmin] = await ethers.getSigners();

        // Deploy mock USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdc = await MockERC20.deploy("USD Coin", "USDC", USDC_DECIMALS);
        await usdc.deployed();

        // Deploy mock IONX
        ionx = await MockERC20.deploy("Ionova Token", "IONX", IONX_DECIMALS);
        await ionx.deployed();

        // Mint USDC to buyers
        await usdc.mint(buyer1.address, 100_000 * 10 ** USDC_DECIMALS);
        await usdc.mint(buyer2.address, 100_000 * 10 ** USDC_DECIMALS);

        // Deploy ValidatorFractionNFT
        const currentTime = await time.latest();
        const saleStart = currentTime + 60; // Starts in 1 minute
        const saleEnd = currentTime + 7776000; // Ends in 90 days

        const ValidatorFractionNFT = await ethers.getContractFactory("ValidatorFractionNFT");
        contract = await ValidatorFractionNFT.deploy(
            usdc.address,
            treasury.address,
            "https://api.ionova.network/metadata/{id}",
            saleStart,
            saleEnd
        );
        await contract.deployed();

        // Set IONX token
        await contract.setIonxToken(ionx.address);

        // Set KYC admin
        await contract.setKYCAdmin(kycAdmin.address, true);
    });

    describe("Deployment", function () {
        it("Should set the correct payment token", async function () {
            expect(await contract.paymentToken()).to.equal(usdc.address);
        });

        it("Should set the correct treasury", async function () {
            expect(await contract.treasury()).to.equal(treasury.address);
        });

        it("Should set owner as KYC admin", async function () {
            expect(await contract.kycAdmins(owner.address)).to.be.true;
        });

        it("Should set IONX token", async function () {
            expect(await contract.ionxToken()).to.equal(ionx.address);
        });
    });

    describe("Pricing", function () {
        it("Should calculate correct price for first fraction", async function () {
            const price = await contract.getFractionPrice(1);
            expect(price).to.equal(START_PRICE);
        });

        it("Should calculate correct price for last fraction", async function () {
            const price = await contract.getFractionPrice(TOTAL_FRACTIONS);
            expect(price).to.be.closeTo(END_PRICE, 1000); // Allow small rounding error
        });

        it("Should calculate correct price for middle fraction", async function () {
            const midFraction = TOTAL_FRACTIONS / 2;
            const expectedPrice = (START_PRICE + END_PRICE) / 2;
            const price = await contract.getFractionPrice(midFraction);
            expect(price).to.be.closeTo(expectedPrice, 1000);
        });

        it("Should calculate total cost for multiple fractions", async function () {
            const quantity = 10;
            const cost = await contract.getTotalCost(quantity);

            let expected = 0;
            for (let i = 1; i <= quantity; i++) {
                expected += Number(await contract.getFractionPrice(i));
            }

            expect(cost).to.equal(expected);
        });

        it("Should revert for invalid fraction number", async function () {
            await expect(contract.getFractionPrice(0)).to.be.revertedWith("Invalid fraction");
            await expect(contract.getFractionPrice(TOTAL_FRACTIONS + 1)).to.be.revertedWith("Invalid fraction");
        });
    });

    describe("KYC Management", function () {
        it("Should allow KYC admin to verify users", async function () {
            await contract.connect(kycAdmin).setKYCStatus(buyer1.address, true);
            expect(await contract.kycVerified(buyer1.address)).to.be.true;
        });

        it("Should allow batch KYC verification", async function () {
            const users = [buyer1.address, buyer2.address];
            const statuses = [true, true];

            await contract.connect(kycAdmin).setKYCStatusBatch(users, statuses);

            expect(await contract.kycVerified(buyer1.address)).to.be.true;
            expect(await contract.kycVerified(buyer2.address)).to.be.true;
        });

        it("Should prevent non-admin from verifying users", async function () {
            await expect(
                contract.connect(buyer1).setKYCStatus(buyer2.address, true)
            ).to.be.revertedWith("Not KYC admin");
        });

        it("Should allow owner to add/remove KYC admins", async function () {
            await contract.setKYCAdmin(buyer1.address, true);
            expect(await contract.kycAdmins(buyer1.address)).to.be.true;

            await contract.setKYCAdmin(buyer1.address, false);
            expect(await contract.kycAdmins(buyer1.address)).to.be.false;
        });
    });

    describe("Purchase Flow", function () {
        beforeEach(async function () {
            // Verify buyer1 for KYC
            await contract.connect(kycAdmin).setKYCStatus(buyer1.address, true);

            // Advance time to sale start
            await time.increase(61);
        });

        it("Should allow KYC-verified user to buy fractions", async function () {
            const quantity = 10;
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer1).approve(contract.address, cost);
            await contract.connect(buyer1).buyFractions(quantity);

            expect(await contract.fractionsSold()).to.equal(quantity);
            expect(await contract.totalFractionsOwned(buyer1.address)).to.equal(quantity);
        });

        it("Should transfer payment to treasury", async function () {
            const quantity = 5;
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer1).approve(contract.address, cost);

            const treasuryBalanceBefore = await usdc.balanceOf(treasury.address);
            await contract.connect(buyer1).buyFractions(quantity);
            const treasuryBalanceAfter = await usdc.balanceOf(treasury.address);

            expect(treasuryBalanceAfter.sub(treasuryBalanceBefore)).to.equal(cost);
        });

        it("Should mint NFTs to buyer", async function () {
            const quantity = 3;
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer1).approve(contract.address, cost);
            await contract.connect(buyer1).buyFractions(quantity);

            for (let i = 1; i <= quantity; i++) {
                expect(await contract.balanceOf(buyer1.address, i)).to.equal(1);
            }
        });

        it("Should prevent non-KYC users from buying", async function () {
            const quantity = 1;
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer2).approve(contract.address, cost);
            await expect(
                contract.connect(buyer2).buyFractions(quantity)
            ).to.be.revertedWith("KYC verification required");
        });

        it("Should prevent buying before sale starts", async function () {
            // Deploy new contract with future start time
            const futureTime = (await time.latest()) + 10000;
            const ValidatorFractionNFT = await ethers.getContractFactory("ValidatorFractionNFT");
            const futureContract = await ValidatorFractionNFT.deploy(
                usdc.address,
                treasury.address,
                "https://api.ionova.network/metadata/{id}",
                futureTime,
                futureTime + 7776000
            );

            await futureContract.setKYCStatus(buyer1.address, true);
            await usdc.connect(buyer1).approve(futureContract.address, START_PRICE);

            await expect(
                futureContract.connect(buyer1).buyFractions(1)
            ).to.be.revertedWith("Sale not started");
        });

        it("Should prevent buying more than available", async function () {
            const quantity = TOTAL_FRACTIONS + 1;

            await expect(
                contract.getTotalCost(quantity)
            ).to.be.revertedWith("Exceeds available");
        });

        it("Should emit FractionPurchased events", async function () {
            const quantity = 2;
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer1).approve(contract.address, cost);

            await expect(contract.connect(buyer1).buyFractions(quantity))
                .to.emit(contract, "FractionPurchased")
                .withArgs(buyer1.address, 1, await contract.getFractionPrice(1))
                .and.to.emit(contract, "FractionPurchased")
                .withArgs(buyer1.address, 2, await contract.getFractionPrice(2));
        });
    });

    describe("Ownership Tracking", function () {
        beforeEach(async function () {
            await contract.setKYCStatus(buyer1.address, true);
            await contract.setKYCStatus(buyer2.address, true);
            await time.increase(61);
        });

        it("Should track total fractions owned", async function () {
            const cost1 = await contract.getTotalCost(10);
            await usdc.connect(buyer1).approve(contract.address, cost1);
            await contract.connect(buyer1).buyFractions(10);

            expect(await contract.getTotalFractionsOwned(buyer1.address)).to.equal(10);

            const cost2 = await contract.getTotalCost(5);
            await usdc.connect(buyer1).approve(contract.address, cost2);
            await contract.connect(buyer1).buyFractions(5);

            expect(await contract.getTotalFractionsOwned(buyer1.address)).to.equal(15);
        });

        it("Should calculate ownership percentage", async function () {
            const quantity = 18000; // 1% of total
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer1).approve(contract.address, cost);
            await contract.connect(buyer1).buyFractions(quantity);

            const percentage = await contract.getOwnershipPercentage(buyer1.address);
            expect(percentage).to.equal(10000); // 1% = 10000 with 6 decimals
        });

        it("Should update fraction count on transfers", async function () {
            // Buy some fractions
            const cost = await contract.getTotalCost(10);
            await usdc.connect(buyer1).approve(contract.address, cost);
            await contract.connect(buyer1).buyFractions(10);

            // Transfer some to buyer2
            await contract.connect(buyer1).safeTransferFrom(
                buyer1.address,
                buyer2.address,
                1,
                1,
                "0x"
            );

            expect(await contract.totalFractionsOwned(buyer1.address)).to.equal(9);
            expect(await contract.totalFractionsOwned(buyer2.address)).to.equal(1);
        });
    });

    describe("Pause Functionality", function () {
        beforeEach(async function () {
            await contract.setKYCStatus(buyer1.address, true);
            await time.increase(61);
        });

        it("Should allow owner to pause contract", async function () {
            await contract.pause();
            expect(await contract.paused()).to.be.true;
        });

        it("Should prevent purchases when paused", async function () {
            await contract.pause();

            const cost = await contract.getTotalCost(1);
            await usdc.connect(buyer1).approve(contract.address, cost);

            await expect(
                contract.connect(buyer1).buyFractions(1)
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow owner to unpause", async function () {
            await contract.pause();
            await contract.unpause();
            expect(await contract.paused()).to.be.false;
        });
    });

    describe("Sale Statistics", function () {
        beforeEach(async function () {
            await contract.setKYCStatus(buyer1.address, true);
            await time.increase(61);
        });

        it("Should return accurate sale stats", async function () {
            const quantity = 1000;
            const cost = await contract.getTotalCost(quantity);

            await usdc.connect(buyer1).approve(contract.address, cost);
            await contract.connect(buyer1).buyFractions(quantity);

            const stats = await contract.getSaleStats();

            expect(stats._fractionsSold).to.equal(quantity);
            expect(stats._fractionsRemaining).to.equal(TOTAL_FRACTIONS - quantity);
            expect(stats._currentPrice).to.equal(await contract.getFractionPrice(quantity + 1));
            expect(stats._percentSold).to.equal(0); // Less than 1%
        });

        it("Should return correct current price", async function () {
            expect(await contract.getCurrentPrice()).to.equal(START_PRICE);

            // Buy some fractions
            const cost = await contract.getTotalCost(100);
            await usdc.connect(buyer1).approve(contract.address, cost);
            await contract.connect(buyer1).buyFractions(100);

            expect(await contract.getCurrentPrice()).to.equal(await contract.getFractionPrice(101));
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to emergency withdraw tokens", async function () {
            // Send some USDC to contract
            await usdc.transfer(contract.address, 1000 * 10 ** USDC_DECIMALS);

            const balanceBefore = await usdc.balanceOf(owner.address);
            await contract.emergencyWithdraw(usdc.address);
            const balanceAfter = await usdc.balanceOf(owner.address);

            expect(balanceAfter.sub(balanceBefore)).to.equal(1000 * 10 ** USDC_DECIMALS);
        });

        it("Should allow owner to emergency withdraw ETH", async function () {
            // Send some ETH to contract
            await owner.sendTransaction({
                to: contract.address,
                value: ethers.utils.parseEther("1.0"),
            });

            const balanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await contract.emergencyWithdrawETH();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            const balanceAfter = await ethers.provider.getBalance(owner.address);

            expect(balanceAfter.add(gasUsed).sub(balanceBefore)).to.equal(ethers.utils.parseEther("1.0"));
        });
    });

    describe("Validator Assignment", function () {
        it("Should assign correct validator for fraction", async function () {
            expect(await contract.getValidatorForFraction(1)).to.equal(0);
            expect(await contract.getValidatorForFraction(100000)).to.equal(0);
            expect(await contract.getValidatorForFraction(100001)).to.equal(1);
            expect(await contract.getValidatorForFraction(200000)).to.equal(1);
            expect(await contract.getValidatorForFraction(1800000)).to.equal(17);
        });
    });
});

// Mock ERC20 for testing
contract MockERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals) {
        // Implementation
    }

    function mint(address to, uint256 amount) external {
        // Implementation
    }
}
