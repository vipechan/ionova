const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IonovaKYCAirdrop", function () {
    let airdrop, ionxToken, owner, admin, user1, user2, user3;
    const AIRDROP_AMOUNT = ethers.utils.parseEther("100");
    const TOTAL_ALLOCATION = ethers.utils.parseEther("10000000");

    beforeEach(async function () {
        [owner, admin, user1, user2, user3] = await ethers.getSigners();

        // Deploy mock IONX token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        ionxToken = await MockERC20.deploy("Ionova Token", "IONX", TOTAL_ALLOCATION);
        await ionxToken.deployed();

        // Deploy airdrop contract
        const IonovaKYCAirdrop = await ethers.getContractFactory("IonovaKYCAirdrop");
        airdrop = await IonovaKYCAirdrop.deploy(ionxToken.address);
        await airdrop.deployed();

        // Fund the airdrop contract
        await ionxToken.approve(airdrop.address, TOTAL_ALLOCATION);
        await ionxToken.transfer(airdrop.address, TOTAL_ALLOCATION);
    });

    describe("Deployment", function () {
        it("Should set the correct IONX token address", async function () {
            expect(await airdrop.ionxToken()).to.equal(ionxToken.address);
        });

        it("Should set owner as KYC admin", async function () {
            expect(await airdrop.kycAdmins(owner.address)).to.be.true;
        });

        it("Should have correct allocation constants", async function () {
            expect(await airdrop.AIRDROP_AMOUNT()).to.equal(AIRDROP_AMOUNT);
            expect(await airdrop.MAX_USERS()).to.equal(100000);
            expect(await airdrop.TOTAL_ALLOCATION()).to.equal(TOTAL_ALLOCATION);
        });
    });

    describe("Wallet Registration", function () {
        it("Should allow users to register their wallet", async function () {
            await airdrop.connect(user1).registerWallet();
            const userData = await airdrop.getUserData(user1.address);
            expect(userData[0]).to.equal(1); // KYCStatus.PENDING
        });

        it("Should prevent double registration", async function () {
            await airdrop.connect(user1).registerWallet();
            await expect(
                airdrop.connect(user1).registerWallet()
            ).to.be.revertedWith("Already registered");
        });

        it("Should increment total submissions", async function () {
            await airdrop.connect(user1).registerWallet();
            const stats = await airdrop.getStatistics();
            expect(stats[0]).to.equal(1); // totalSubmissions
        });

        it("Should emit WalletRegistered event", async function () {
            await expect(airdrop.connect(user1).registerWallet())
                .to.emit(airdrop, "WalletRegistered")
                .withArgs(user1.address, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
        });
    });

    describe("KYC Approval", function () {
        beforeEach(async function () {
            await airdrop.connect(user1).registerWallet();
        });

        it("Should allow admin to approve KYC", async function () {
            await airdrop.connect(owner).approveKYC(user1.address);
            const userData = await airdrop.getUserData(user1.address);
            expect(userData[0]).to.equal(2); // KYCStatus.APPROVED
            expect(userData[3]).to.be.true; // airdropClaimed
        });

        it("Should transfer 100 IONX on approval", async function () {
            const balanceBefore = await ionxToken.balanceOf(user1.address);
            await airdrop.connect(owner).approveKYC(user1.address);
            const balanceAfter = await ionxToken.balanceOf(user1.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(AIRDROP_AMOUNT);
        });

        it("Should update statistics on approval", async function () {
            await airdrop.connect(owner).approveKYC(user1.address);
            const stats = await airdrop.getStatistics();
            expect(stats[1]).to.equal(1); // totalApproved
            expect(stats[3]).to.equal(1); // totalAirdropsClaimed
            expect(stats[4]).to.equal(AIRDROP_AMOUNT); // totalTokensDistributed
        });

        it("Should prevent non-admin from approving", async function () {
            await expect(
                airdrop.connect(user2).approveKYC(user1.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("Should prevent approving non-pending KYC", async function () {
            await airdrop.connect(owner).approveKYC(user1.address);
            await expect(
                airdrop.connect(owner).approveKYC(user1.address)
            ).to.be.revertedWith("Not pending approval");
        });

        it("Should emit KYCApproved and AirdropClaimed events", async function () {
            await expect(airdrop.connect(owner).approveKYC(user1.address))
                .to.emit(airdrop, "KYCApproved")
                .and.to.emit(airdrop, "AirdropClaimed");
        });
    });

    describe("KYC Rejection", function () {
        beforeEach(async function () {
            await airdrop.connect(user1).registerWallet();
        });

        it("Should allow admin to reject KYC", async function () {
            await airdrop.connect(owner).rejectKYC(user1.address, "Invalid documents");
            const userData = await airdrop.getUserData(user1.address);
            expect(userData[0]).to.equal(3); // KYCStatus.REJECTED
            expect(userData[4]).to.equal("Invalid documents");
        });

        it("Should increment rejection count", async function () {
            await airdrop.connect(owner).rejectKYC(user1.address, "Test");
            const stats = await airdrop.getStatistics();
            expect(stats[2]).to.equal(1); // totalRejected
        });

        it("Should require rejection reason", async function () {
            await expect(
                airdrop.connect(owner).rejectKYC(user1.address, "")
            ).to.be.revertedWith("Reason required");
        });

        it("Should emit KYCRejected event", async function () {
            await expect(airdrop.connect(owner).rejectKYC(user1.address, "Test"))
                .to.emit(airdrop, "KYCRejected");
        });
    });

    describe("Batch Approval", function () {
        beforeEach(async function () {
            await airdrop.connect(user1).registerWallet();
            await airdrop.connect(user2).registerWallet();
            await airdrop.connect(user3).registerWallet();
        });

        it("Should approve multiple users at once", async function () {
            const addresses = [user1.address, user2.address, user3.address];
            await airdrop.connect(owner).batchApproveKYC(addresses);

            const userData1 = await airdrop.getUserData(user1.address);
            const userData2 = await airdrop.getUserData(user2.address);
            const userData3 = await airdrop.getUserData(user3.address);

            expect(userData1[0]).to.equal(2); // APPROVED
            expect(userData2[0]).to.equal(2); // APPROVED
            expect(userData3[0]).to.equal(2); // APPROVED
        });

        it("Should transfer tokens to all approved users", async function () {
            const addresses = [user1.address, user2.address];
            await airdrop.connect(owner).batchApproveKYC(addresses);

            expect(await ionxToken.balanceOf(user1.address)).to.equal(AIRDROP_AMOUNT);
            expect(await ionxToken.balanceOf(user2.address)).to.equal(AIRDROP_AMOUNT);
        });

        it("Should update statistics correctly", async function () {
            const addresses = [user1.address, user2.address, user3.address];
            await airdrop.connect(owner).batchApproveKYC(addresses);

            const stats = await airdrop.getStatistics();
            expect(stats[1]).to.equal(3); // totalApproved
            expect(stats[3]).to.equal(3); // totalAirdropsClaimed
        });
    });

    describe("Admin Management", function () {
        it("Should allow owner to add KYC admin", async function () {
            await airdrop.connect(owner).addKYCAdmin(admin.address);
            expect(await airdrop.kycAdmins(admin.address)).to.be.true;
        });

        it("Should allow new admin to approve KYC", async function () {
            await airdrop.connect(owner).addKYCAdmin(admin.address);
            await airdrop.connect(user1).registerWallet();
            await airdrop.connect(admin).approveKYC(user1.address);

            const userData = await airdrop.getUserData(user1.address);
            expect(userData[0]).to.equal(2); // APPROVED
        });

        it("Should allow owner to remove admin", async function () {
            await airdrop.connect(owner).addKYCAdmin(admin.address);
            await airdrop.connect(owner).removeKYCAdmin(admin.address);
            expect(await airdrop.kycAdmins(admin.address)).to.be.false;
        });

        it("Should prevent non-owner from adding admin", async function () {
            await expect(
                airdrop.connect(user1).addKYCAdmin(admin.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to pause contract", async function () {
            await airdrop.connect(owner).pause();
            await expect(
                airdrop.connect(user1).registerWallet()
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should allow owner to unpause contract", async function () {
            await airdrop.connect(owner).pause();
            await airdrop.connect(owner).unpause();
            await expect(airdrop.connect(user1).registerWallet()).to.not.be.reverted;
        });

        it("Should allow owner to withdraw unclaimed funds", async function () {
            const balanceBefore = await ionxToken.balanceOf(owner.address);
            await airdrop.connect(owner).withdrawUnclaimed(owner.address, AIRDROP_AMOUNT);
            const balanceAfter = await ionxToken.balanceOf(owner.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(AIRDROP_AMOUNT);
        });
    });

    describe("Statistics", function () {
        it("Should return correct statistics", async function () {
            await airdrop.connect(user1).registerWallet();
            await airdrop.connect(user2).registerWallet();
            await airdrop.connect(owner).approveKYC(user1.address);
            await airdrop.connect(owner).rejectKYC(user2.address, "Test");

            const stats = await airdrop.getStatistics();
            expect(stats[0]).to.equal(2); // totalSubmissions
            expect(stats[1]).to.equal(1); // totalApproved
            expect(stats[2]).to.equal(1); // totalRejected
            expect(stats[3]).to.equal(1); // totalAirdropsClaimed
            expect(stats[4]).to.equal(AIRDROP_AMOUNT); // totalTokensDistributed
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero balance gracefully", async function () {
            // Withdraw all funds
            const balance = await ionxToken.balanceOf(airdrop.address);
            await airdrop.connect(owner).withdrawUnclaimed(owner.address, balance);

            await airdrop.connect(user1).registerWallet();
            await expect(
                airdrop.connect(owner).approveKYC(user1.address)
            ).to.be.revertedWith("Insufficient contract balance");
        });

        it("Should prevent reset of non-rejected KYC", async function () {
            await airdrop.connect(user1).registerWallet();
            await expect(
                airdrop.connect(owner).resetKYC(user1.address)
            ).to.be.revertedWith("Not rejected");
        });

        it("Should allow reset of rejected KYC", async function () {
            await airdrop.connect(user1).registerWallet();
            await airdrop.connect(owner).rejectKYC(user1.address, "Test");
            await airdrop.connect(owner).resetKYC(user1.address);

            const userData = await airdrop.getUserData(user1.address);
            expect(userData[0]).to.equal(1); // PENDING
        });
    });
});
