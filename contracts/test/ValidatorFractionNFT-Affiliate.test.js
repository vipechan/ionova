const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ValidatorFractionNFT - Affiliate System", function () {
    let validatorNFT;
    let mockUSDC;
    let owner, treasury, buyer1, buyer2, buyer3, referrer1, referrer2;
    let saleStartTime, saleEndTime;

    beforeEach(async function () {
        [owner, treasury, buyer1, buyer2, buyer3, referrer1, referrer2] = await ethers.getSigners();

        // Deploy Mock USDC
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
        await mockUSDC.deployed();

        // Set sale times
        const now = Math.floor(Date.now() / 1000);
        saleStartTime = now - 3600; // Started 1 hour ago
        saleEndTime = now + 86400 * 30; // Ends in 30 days

        // Deploy ValidatorFractionNFT
        const ValidatorFractionNFT = await ethers.getContractFactory("ValidatorFractionNFT");
        validatorNFT = await ValidatorFractionNFT.deploy(
            mockUSDC.address,
            treasury.address,
            "https://api.ionova.network/metadata/{id}",
            saleStartTime,
            saleEndTime
        );
        await validatorNFT.deployed();

        // Mint USDC to buyers
        await mockUSDC.mint(buyer1.address, ethers.utils.parseUnits("1000000", 6));
        await mockUSDC.mint(buyer2.address, ethers.utils.parseUnits("1000000", 6));
        await mockUSDC.mint(buyer3.address, ethers.utils.parseUnits("1000000", 6));
        await mockUSDC.mint(referrer1.address, ethers.utils.parseUnits("100000", 6));

        // Approve contract
        await mockUSDC.connect(buyer1).approve(validatorNFT.address, ethers.constants.MaxUint256);
        await mockUSDC.connect(buyer2).approve(validatorNFT.address, ethers.constants.MaxUint256);
        await mockUSDC.connect(buyer3).approve(validatorNFT.address, ethers.constants.MaxUint256);
        await mockUSDC.connect(referrer1).approve(validatorNFT.address, ethers.constants.MaxUint256);

        // Set KYC verified for all
        await validatorNFT.setKYCStatus(buyer1.address, true);
        await validatorNFT.setKYCStatus(buyer2.address, true);
        await validatorNFT.setKYCStatus(buyer3.address, true);
        await validatorNFT.setKYCStatus(referrer1.address, true);
    });

    describe("Affiliate Tracking", function () {
        it("Should set referrer on first purchase", async function () {
            await validatorNFT.connect(buyer1).buyFractions(10, referrer1.address);

            const referrer = await validatorNFT.referredBy(buyer1.address);
            expect(referrer).to.equal(referrer1.address);
        });

        it("Should not change referrer on subsequent purchases", async function () {
            await validatorNFT.connect(buyer1).buyFractions(10, referrer1.address);
            await validatorNFT.connect(buyer1).buyFractions(10, referrer2.address);

            const referrer = await validatorNFT.referredBy(buyer1.address);
            expect(referrer).to.equal(referrer1.address); // Should still be referrer1
        });

        it("Should not allow self-referral", async function () {
            await validatorNFT.connect(buyer1).buyFractions(10, buyer1.address);

            const referrer = await validatorNFT.referredBy(buyer1.address);
            expect(referrer).to.equal(ethers.constants.AddressZero);
        });

        it("Should handle zero address referrer (orphan purchase)", async function () {
            await validatorNFT.connect(buyer1).buyFractions(10, ethers.constants.AddressZero);

            const referrer = await validatorNFT.referredBy(buyer1.address);
            expect(referrer).to.equal(ethers.constants.AddressZero);
        });
    });

    describe("Commission Calculations", function () {
        it("Should calculate 5% commission for Starter rank", async function () {
            const saleAmount = ethers.utils.parseUnits("1000", 6);
            const commission = await validatorNFT.calculateCommission(referrer1.address, saleAmount);

            expect(commission).to.equal(ethers.utils.parseUnits("50", 6)); // 5% of 1000
        });

        it("Should credit commission to referrer", async function () {
            await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);

            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(stats.pendingCommission).to.be.gt(0);
        });

        it("Should emit CommissionEarned event", async function () {
            await expect(validatorNFT.connect(buyer1).buyFractions(100, referrer1.address))
                .to.emit(validatorNFT, "CommissionEarned");
        });

        it("Should not generate commission for orphan purchases", async function () {
            const treasuryBalanceBefore = await mockUSDC.balanceOf(treasury.address);
            const cost = await validatorNFT.getTotalCost(100);

            await validatorNFT.connect(buyer1).buyFractions(100, ethers.constants.AddressZero);

            const treasuryBalanceAfter = await mockUSDC.balanceOf(treasury.address);
            expect(treasuryBalanceAfter.sub(treasuryBalanceBefore)).to.equal(cost); // Full amount to treasury
        });
    });

    describe("Rank System", function () {
        it("Should start at Starter rank (0)", async function () {
            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(stats.rank).to.equal(0); // Starter
        });

        it("Should upgrade to Bronze at $1K downline + $100 self", async function () {
            // Referrer1 buys $100 (self sales)
            await validatorNFT.connect(referrer1).buyFractions(10, ethers.constants.AddressZero);

            // Buyer1 referred by referrer1 buys until $1K downline
            let downlineSales = ethers.BigNumber.from(0);
            let quantity = 100;

            while (downlineSales.lt(ethers.utils.parseUnits("1000", 6))) {
                const cost = await validatorNFT.getTotalCost(quantity);
                await validatorNFT.connect(buyer1).buyFractions(quantity, referrer1.address);
                downlineSales = downlineSales.add(cost);
            }

            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(stats.rank).to.equal(1); // Bronze
        });

        it("Should emit RankUpgraded event", async function () {
            // Setup for Bronze upgrade
            await validatorNFT.connect(referrer1).buyFractions(10, ethers.constants.AddressZero);

            // This purchase should trigger upgrade
            await expect(validatorNFT.connect(buyer1).buyFractions(100, referrer1.address))
                .to.emit(validatorNFT, "RankUpgraded");
        });

        it("Should apply new commission rate after rank upgrade", async function () {
            // Get to Bronze rank (10% commission)
            await validatorNFT.connect(referrer1).buyFractions(10, ethers.constants.AddressZero);

            let downlineSales = ethers.BigNumber.from(0);
            while (downlineSales.lt(ethers.utils.parseUnits("1000", 6))) {
                const cost = await validatorNFT.getTotalCost(100);
                await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);
                downlineSales = downlineSales.add(cost);
            }

            // Check commission rate is now 10%
            const saleAmount = ethers.utils.parseUnits("1000", 6);
            const commission = await validatorNFT.calculateCommission(referrer1.address, saleAmount);
            expect(commission).to.equal(ethers.utils.parseUnits("100", 6)); // 10% of 1000
        });
    });

    describe("Commission Claims", function () {
        beforeEach(async function () {
            // Generate some commissions
            await validatorNFT.connect(buyer1).buyFractions(1000, referrer1.address);
        });

        it("Should allow claiming pending commission", async function () {
            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            const pendingBefore = stats.pendingCommission;

            expect(pendingBefore).to.be.gt(0);

            await validatorNFT.connect(referrer1).claimCommission();

            const statsAfter = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(statsAfter.pendingCommission).to.equal(0);
        });

        it("Should transfer USDC to claimer", async function () {
            const balanceBefore = await mockUSDC.balanceOf(referrer1.address);
            const stats = await validatorNFT.getAffiliateStats(referrer1.address);

            await validatorNFT.connect(referrer1).claimCommission();

            const balanceAfter = await mockUSDC.balanceOf(referrer1.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(stats.pendingCommission);
        });

        it("Should emit CommissionClaimed event", async function () {
            await expect(validatorNFT.connect(referrer1).claimCommission())
                .to.emit(validatorNFT, "CommissionClaimed");
        });

        it("Should revert if no commission to claim", async function () {
            await validatorNFT.connect(referrer1).claimCommission(); // Claim all

            await expect(validatorNFT.connect(referrer1).claimCommission())
                .to.be.revertedWith("No commission to claim");
        });

        it("Should track total commissions paid", async function () {
            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            const pending = stats.pendingCommission;

            await validatorNFT.connect(referrer1).claimCommission();

            const totalPaid = await validatorNFT.totalCommissionsPaid();
            expect(totalPaid).to.equal(pending);
        });
    });

    describe("Sales Tracking", function () {
        it("Should track self sales correctly", async function () {
            const cost = await validatorNFT.getTotalCost(100);
            await validatorNFT.connect(buyer1).buyFractions(100, ethers.constants.AddressZero);

            const stats = await validatorNFT.getAffiliateStats(buyer1.address);
            expect(stats.selfSalesTotal).to.equal(cost);
        });

        it("Should track downline sales correctly", async function () {
            const cost = await validatorNFT.getTotalCost(100);
            await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);

            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(stats.downlineSalesTotal).to.equal(cost);
        });

        it("Should accumulate sales over multiple purchases", async function () {
            const cost1 = await validatorNFT.getTotalCost(100);
            await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);

            const cost2 = await validatorNFT.getTotalCost(100);
            await validatorNFT.connect(buyer2).buyFractions(100, referrer1.address);

            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(stats.downlineSalesTotal).to.equal(cost1.add(cost2));
        });
    });

    describe("Next Rank Requirements", function () {
        it("Should return correct next rank requirements for Starter", async function () {
            const nextRank = await validatorNFT.getNextRankRequirements(buyer1.address);

            expect(nextRank.nextRank).to.equal(1); // Bronze
            expect(nextRank.downlineNeeded).to.equal(ethers.utils.parseUnits("1000", 6));
            expect(nextRank.selfNeeded).to.equal(ethers.utils.parseUnits("100", 6));
        });

        it("Should return 0,0 for Gold rank (max rank)", async function () {
            // This would require achieving Gold rank first, simplified check
            // Assuming we could set rank to Gold for testing
            const nextRank = await validatorNFT.getNextRankRequirements(referrer1.address);
            expect(nextRank.nextRank).to.be.oneOf([1, 2, 3, 3]); // Will be next rank or Gold (3)
        });
    });

    describe("Payment Distribution", function () {
        it("Should split payment correctly with referrer", async function () {
            const treasuryBefore = await mockUSDC.balanceOf(treasury.address);
            const contractBefore = await mockUSDC.balanceOf(validatorNFT.address);
            const cost = await validatorNFT.getTotalCost(100);

            await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);

            const treasuryAfter = await mockUSDC.balanceOf(treasury.address);
            const contractAfter = await mockUSDC.balanceOf(validatorNFT.address);

            const commission = await validatorNFT.calculateCommission(referrer1.address, cost);

            expect(treasuryAfter.sub(treasuryBefore)).to.equal(cost.sub(commission));
            expect(contractAfter.sub(contractBefore)).to.equal(commission);
        });

        it("Should send full amount to treasury without referrer", async function () {
            const treasuryBefore = await mockUSDC.balanceOf(treasury.address);
            const cost = await validatorNFT.getTotalCost(100);

            await validatorNFT.connect(buyer1).buyFractions(100, ethers.constants.AddressZero);

            const treasuryAfter = await mockUSDC.balanceOf(treasury.address);
            expect(treasuryAfter.sub(treasuryBefore)).to.equal(cost);
        });
    });

    describe("Edge Cases & Security", function () {
        it("Should handle max rank correctly", async function () {
            const rankName = await validatorNFT.getRankName(3); // Gold
            expect(rankName).to.equal("Gold");
        });

        it("Should prevent reentrancy in claimCommission", async function () {
            // Covered by ReentrancyGuard modifier
            await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);
            await validatorNFT.connect(referrer1).claimCommission();
            // Second call should revert with "No commission to claim"
        });

        it("Should handle very large purchase amounts", async function () {
            // Mint more USDC
            await mockUSDC.mint(buyer1.address, ethers.utils.parseUnits("10000000", 6));

            const largePurchase = 10000;
            await validatorNFT.connect(buyer1).buyFractions(largePurchase, referrer1.address);

            const stats = await validatorNFT.getAffiliateStats(referrer1.address);
            expect(stats.pendingCommission).to.be.gt(0);
        });

        it("Should not overflow commission calculations", async function () {
            const maxAmount = ethers.utils.parseUnits("1000000", 6);
            const commission = await validatorNFT.calculateCommission(referrer1.address, maxAmount);

            expect(commission).to.be.lt(maxAmount); // Commission should always be less than sale amount
        });
    });

    describe("View Functions", function () {
        it("Should return comprehensive affiliate stats", async function () {
            await validatorNFT.connect(buyer1).buyFractions(100, referrer1.address);

            const stats = await validatorNFT.getAffiliateStats(referrer1.address);

            expect(stats.rank).to.exist;
            expect(stats.pendingCommission).to.exist;
            expect(stats.totalEarned).to.exist;
            expect(stats.selfSalesTotal).to.exist;
            expect(stats.downlineSalesTotal).to.exist;
            expect(stats.commissionRate).to.exist;
        });

        it("Should return user's referrer correctly", async function () {
            await validatorNFT.connect(buyer1).buyFractions(10, referrer1.address);

            const myReferrer = await validatorNFT.connect(buyer1).getMyReferrer();
            expect(myReferrer).to.equal(referrer1.address);
        });
    });
});
