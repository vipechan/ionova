const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IonoPay", function () {
    let ionoPay;
    let owner, merchant, user1, user2;

    beforeEach(async function () {
        [owner, merchant, user1, user2] = await ethers.getSigners();

        const IonoPay = await ethers.getContractFactory("IonoPay");
        ionoPay = await IonoPay.deploy();
        await ionoPay.waitForDeployment();
    });

    describe("Merchant Registration", function () {
        it("Should register a merchant", async function () {
            await ionoPay.connect(merchant).registerMerchant(
                "Test Store",
                "E-commerce"
            );

            const merchantData = await ionoPay.getMerchant(merchant.address);
            expect(merchantData.name).to.equal("Test Store");
            expect(merchantData.category).to.equal("E-commerce");
            expect(merchantData.verified).to.be.false;
        });

        it("Should not allow duplicate registration", async function () {
            await ionoPay.connect(merchant).registerMerchant(
                "Test Store",
                "E-commerce"
            );

            await expect(
                ionoPay.connect(merchant).registerMerchant("Test Store 2", "Retail")
            ).to.be.revertedWith("Already registered");
        });

        it("Should verify merchant (owner only)", async function () {
            await ionoPay.connect(merchant).registerMerchant(
                "Test Store",
                "E-commerce"
            );

            await ionoPay.connect(owner).verifyMerchant(merchant.address);

            const merchantData = await ionoPay.getMerchant(merchant.address);
            expect(merchantData.verified).to.be.true;
        });
    });

    describe("Payments", function () {
        beforeEach(async function () {
            await ionoPay.connect(merchant).registerMerchant(
                "Test Store",
                "E-commerce"
            );
        });

        it("Should send a payment", async function () {
            const amount = ethers.parseEther("1.0");
            const invoiceId = ethers.id("INV-001");
            const memo = "Test payment";

            const tx = await ionoPay.connect(user1).sendPayment(
                merchant.address,
                invoiceId,
                memo,
                { value: amount }
            );

            await expect(tx)
                .to.emit(ionoPay, "PaymentSent")
                .withArgs(
                    (paymentId) => paymentId !== ethers.ZeroHash,
                    user1.address,
                    merchant.address,
                    amount,
                    invoiceId,
                    memo
                );

            // Check merchant received funds
            const merchantData = await ionoPay.getMerchant(merchant.address);
            expect(merchantData.totalReceived).to.equal(amount);
            expect(merchantData.paymentCount).to.equal(1);
        });

        it("Should not allow payment to self", async function () {
            const amount = ethers.parseEther("1.0");
            const invoiceId = ethers.id("INV-001");

            await expect(
                ionoPay.connect(user1).sendPayment(
                    user1.address,
                    invoiceId,
                    "Self payment",
                    { value: amount }
                )
            ).to.be.revertedWith("Cannot send to self");
        });

        it("Should enforce rate limits for unverified users", async function () {
            const amount = ethers.parseEther("0.1");
            const invoiceId = ethers.id("INV");

            // Send 100 payments (limit for unverified)
            for (let i = 0; i < 100; i++) {
                await ionoPay.connect(user1).sendPayment(
                    merchant.address,
                    ethers.id(`INV-${i}`),
                    `Payment ${i}`,
                    { value: amount }
                );
            }

            // 101st payment should fail
            await expect(
                ionoPay.connect(user1).sendPayment(
                    merchant.address,
                    invoiceId,
                    "Over limit",
                    { value: amount }
                )
            ).to.be.revertedWith("Daily limit reached");
        });

        it("Should allow higher limits for verified merchants", async function () {
            // Verify the user as merchant
            await ionoPay.connect(user1).registerMerchant("User Store", "Retail");
            await ionoPay.connect(owner).verifyMerchant(user1.address);

            const amount = ethers.parseEther("0.1");

            // Should allow more than 100 payments
            for (let i = 0; i < 150; i++) {
                await ionoPay.connect(user1).sendPayment(
                    merchant.address,
                    ethers.id(`INV-${i}`),
                    `Payment ${i}`,
                    { value: amount }
                );
            }

            const count = await ionoPay.getDailyPaymentCount(user1.address);
            expect(count).to.equal(150);
        });
    });

    describe("Refunds", function () {
        let paymentId;
        const amount = ethers.parseEther("1.0");

        beforeEach(async function () {
            await ionoPay.connect(merchant).registerMerchant(
                "Test Store",
                "E-commerce"
            );

            const invoiceId = ethers.id("INV-001");
            const tx = await ionoPay.connect(user1).sendPayment(
                merchant.address,
                invoiceId,
                "Test payment",
                { value: amount }
            );

            const receipt = await tx.wait();
            const event = receipt.logs.find(
                (log) => log.fragment && log.fragment.name === "PaymentSent"
            );
            paymentId = event.args[0];
        });

        it("Should allow merchant to refund payment", async function () {
            const userBalanceBefore = await ethers.provider.getBalance(user1.address);

            await ionoPay.connect(merchant).refundPayment(paymentId);

            const userBalanceAfter = await ethers.provider.getBalance(user1.address);
            expect(userBalanceAfter - userBalanceBefore).to.equal(amount);

            const payment = await ionoPay.getPayment(paymentId);
            expect(payment.refunded).to.be.true;
            expect(payment.status).to.equal(3); // Refunded status
        });

        it("Should not allow non-merchant to refund", async function () {
            await expect(
                ionoPay.connect(user2).refundPayment(paymentId)
            ).to.be.revertedWith("Only recipient can refund");
        });

        it("Should not allow double refund", async function () {
            await ionoPay.connect(merchant).refundPayment(paymentId);

            await expect(
                ionoPay.connect(merchant).refundPayment(paymentId)
            ).to.be.revertedWith("Already refunded");
        });
    });

    describe("Analytics", function () {
        it("Should track total payments and volume", async function () {
            await ionoPay.connect(merchant).registerMerchant(
                "Test Store",
                "E-commerce"
            );

            const amount1 = ethers.parseEther("1.0");
            const amount2 = ethers.parseEther("2.0");

            await ionoPay.connect(user1).sendPayment(
                merchant.address,
                ethers.id("INV-001"),
                "Payment 1",
                { value: amount1 }
            );

            await ionoPay.connect(user2).sendPayment(
                merchant.address,
                ethers.id("INV-002"),
                "Payment 2",
                { value: amount2 }
            );

            expect(await ionoPay.totalPayments()).to.equal(2);
            expect(await ionoPay.totalVolume()).to.equal(amount1 + amount2);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to pause/unpause", async function () {
            await ionoPay.connect(owner).pause();
            expect(await ionoPay.paused()).to.be.true;

            await expect(
                ionoPay.connect(user1).sendPayment(
                    merchant.address,
                    ethers.id("INV-001"),
                    "Test",
                    { value: ethers.parseEther("1.0") }
                )
            ).to.be.revertedWith("Pausable: paused");

            await ionoPay.connect(owner).unpause();
            expect(await ionoPay.paused()).to.be.false;
        });
    });
});
