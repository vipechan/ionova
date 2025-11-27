const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FraudDetection", function () {
    let fraudDetection;
    let gameAssets;
    let owner, investigator, user1, user2;

    beforeEach(async function () {
        [owner, investigator, user1, user2] = await ethers.getSigners();

        // Deploy FraudDetection
        const FraudDetection = await ethers.getContractFactory("FraudDetection");
        fraudDetection = await FraudDetection.deploy();
        await fraudDetection.deployed();

        // Deploy GameAssets
        const GameAssets = await ethers.getContractFactory("GameAssets");
        gameAssets = await GameAssets.deploy(fraudDetection.address);
        await gameAssets.deployed();

        // Grant roles
        const FRAUD_INVESTIGATOR_ROLE = await fraudDetection.FRAUD_INVESTIGATOR_ROLE();
        await fraudDetection.grantRole(FRAUD_INVESTIGATOR_ROLE, investigator.address);
    });

    describe("Account Freezing", function () {
        it("Should freeze account manually", async function () {
            await fraudDetection.connect(investigator).freezeAccount(
                user1.address,
                "Suspicious activity detected",
                8
            );

            expect(await fraudDetection.isAccountFrozen(user1.address)).to.be.true;
        });

        it("Should prevent frozen account from transferring assets", async function () {
            // Create and mint asset
            await gameAssets.createAsset(1, "Sword", "weapon", 3, "metadata", true, 1000);
            await gameAssets.mint(user1.address, 0, 10, "0x");

            // Freeze account
            await fraudDetection.connect(investigator).freezeAccount(
                user1.address,
                "Fraud detected",
                9
            );

            // Try to transfer - should fail
            await expect(
                gameAssets.connect(user1).safeTransferFrom(
                    user1.address,
                    user2.address,
                    0,
                    5,
                    "0x"
                )
            ).to.be.revertedWith("Sender account is frozen");
        });

        it("Should unfreeze account", async function () {
            await fraudDetection.connect(investigator).freezeAccount(
                user1.address,
                "Test freeze",
                5
            );

            await fraudDetection.connect(investigator).unfreezeAccount(
                user1.address,
                "False positive"
            );

            expect(await fraudDetection.isAccountFrozen(user1.address)).to.be.false;
        });
    });

    describe("Risk Score Tracking", function () {
        it("Should track transaction activity", async function () {
            await fraudDetection.trackTransaction(user1.address, 100);

            const details = await fraudDetection.getAccountRiskDetails(user1.address);
            expect(details.transactionCount).to.equal(1);
        });

        it("Should track minting activity", async function () {
            await fraudDetection.trackMinting(user1.address);

            const details = await fraudDetection.getAccountRiskDetails(user1.address);
            expect(details.mintCount).to.equal(1);
        });

        it("Should auto-freeze on high risk score", async function () {
            // Simulate excessive activity
            for (let i = 0; i < 60; i++) {
                await fraudDetection.trackMinting(user1.address);
            }

            // Should be auto-frozen
            expect(await fraudDetection.isAccountFrozen(user1.address)).to.be.true;
        });

        it("Should update risk score", async function () {
            await fraudDetection.connect(investigator).recordSuspiciousActivity(
                user1.address,
                "Bot-like behavior",
                15,
                "Evidence: rapid transactions"
            );

            const details = await fraudDetection.getAccountRiskDetails(user1.address);
            expect(details.riskScore).to.be.gt(0);
        });
    });

    describe("Fraud Rules", function () {
        it("Should create new fraud rule", async function () {
            await fraudDetection.createFraudRule(
                "Custom Rule",
                50,
                3600,
                7
            );

            const rule = await fraudDetection.fraudRules(4); // nextRuleId starts at 4
            expect(rule.name).to.equal("Custom Rule");
            expect(rule.threshold).to.equal(50);
        });

        it("Should update fraud rule", async function () {
            await fraudDetection.updateFraudRule(
                0, // First default rule
                200, // New threshold
                7200, // New time window
                true,
                8
            );

            const rule = await fraudDetection.fraudRules(0);
            expect(rule.threshold).to.equal(200);
        });

        it("Should disable fraud rule", async function () {
            await fraudDetection.updateFraudRule(0, 100, 3600, false, 7);

            const rule = await fraudDetection.fraudRules(0);
            expect(rule.enabled).to.be.false;
        });
    });

    describe("Dispute Resolution", function () {
        it("Should allow user to file dispute", async function () {
            // Freeze account
            await fraudDetection.connect(investigator).freezeAccount(
                user1.address,
                "Suspected fraud",
                6
            );

            // File dispute
            await expect(
                fraudDetection.connect(user1).fileDispute("I didn't do anything wrong")
            ).to.emit(fraudDetection, "DisputeFiled");

            const details = await fraudDetection.frozenAccountDetails(user1.address);
            expect(details.disputed).to.be.true;
        });

        it("Should resolve dispute in favor of user", async function () {
            const DISPUTE_RESOLVER_ROLE = await fraudDetection.DISPUTE_RESOLVER_ROLE();
            await fraudDetection.grantRole(DISPUTE_RESOLVER_ROLE, owner.address);

            // Freeze and dispute
            await fraudDetection.connect(investigator).freezeAccount(
                user1.address,
                "Test",
                5
            );
            await fraudDetection.connect(user1).fileDispute("Dispute");

            // Resolve in favor of user
            await fraudDetection.resolveDispute(
                user1.address,
                true,
                "Resolved: False positive"
            );

            expect(await fraudDetection.isAccountFrozen(user1.address)).to.be.false;
        });
    });

    describe("Asset Freezing", function () {
        it("Should freeze specific asset", async function () {
            await gameAssets.createAsset(1, "Rare Item", "item", 5, "meta", true, 100);
            await gameAssets.mint(user1.address, 0, 10, "0x");

            await gameAssets.freezeAsset(0, user1.address);

            expect(await gameAssets.isAssetFrozen(0, user1.address)).to.be.true;
        });

        it("Should prevent transfer of frozen asset", async function () {
            await gameAssets.createAsset(1, "Item", "item", 3, "meta", true, 100);
            await gameAssets.mint(user1.address, 0, 10, "0x");

            await gameAssets.freezeAsset(0, user1.address);

            await expect(
                gameAssets.connect(user1).safeTransferFrom(
                    user1.address,
                    user2.address,
                    0,
                    5,
                    "0x"
                )
            ).to.be.revertedWith("Asset is frozen for sender");
        });

        it("Should unfreeze asset", async function () {
            await gameAssets.createAsset(1, "Item", "item", 3, "meta", true, 100);
            await gameAssets.mint(user1.address, 0, 10, "0x");

            await gameAssets.freezeAsset(0, user1.address);
            await gameAssets.unfreezeAsset(0, user1.address);

            expect(await gameAssets.isAssetFrozen(0, user1.address)).to.be.false;
        });
    });

    describe("Integration Tests", function () {
        it("Should prevent minting to frozen account", async function () {
            await fraudDetection.connect(investigator).freezeAccount(
                user1.address,
                "Fraud",
                9
            );

            await gameAssets.createAsset(1, "Item", "item", 3, "meta", true, 100);

            await expect(
                gameAssets.mint(user1.address, 0, 10, "0x")
            ).to.be.revertedWith("Recipient account is frozen");
        });

        it("Should track minting and auto-freeze on abuse", async function () {
            await gameAssets.createAsset(1, "Item", "item", 1, "meta", true, 10000);

            // Mint many times to trigger fraud detection
            for (let i = 0; i < 55; i++) {
                await gameAssets.mint(user1.address, 0, 1, "0x");
            }

            // Should be auto-frozen
            expect(await fraudDetection.isAccountFrozen(owner.address)).to.be.true;
        });
    });
});
