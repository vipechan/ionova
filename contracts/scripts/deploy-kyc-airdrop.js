const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Ionova KYC Airdrop Contract...\n");

    // Get the contract factory
    const IonovaKYCAirdrop = await hre.ethers.getContractFactory("IonovaKYCAirdrop");

    // Get IONX token address (you'll need to update this)
    const IONX_TOKEN_ADDRESS = process.env.IONX_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

    if (IONX_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.error("❌ ERROR: IONX_TOKEN_ADDRESS not set in environment variables");
        console.log("Please set IONX_TOKEN_ADDRESS=0x... in your .env file\n");
        process.exit(1);
    }

    console.log("📝 Configuration:");
    console.log(`   IONX Token Address: ${IONX_TOKEN_ADDRESS}`);
    console.log(`   Airdrop Amount: 100 IONX per user`);
    console.log(`   Max Users: 100,000`);
    console.log(`   Total Allocation: 10,000,000 IONX\n`);

    // Deploy the contract
    console.log("⏳ Deploying contract...");
    const airdrop = await IonovaKYCAirdrop.deploy(IONX_TOKEN_ADDRESS);
    await airdrop.deployed();

    console.log("✅ Contract deployed successfully!");
    console.log(`   Address: ${airdrop.address}\n`);

    // Get deployer info
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployed by:", deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Display contract info
    const stats = await airdrop.getStatistics();
    console.log("📊 Initial Statistics:");
    console.log(`   Total Submissions: ${stats[0]}`);
    console.log(`   Total Approved: ${stats[1]}`);
    console.log(`   Total Rejected: ${stats[2]}`);
    console.log(`   Contract Balance: ${hre.ethers.utils.formatEther(stats[6])} IONX`);
    console.log(`   Available Airdrops: ${stats[5]}\n`);

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: airdrop.address,
        ionxTokenAddress: IONX_TOKEN_ADDRESS,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        blockNumber: airdrop.deployTransaction.blockNumber,
        transactionHash: airdrop.deployTransaction.hash,
        airdropAmount: "100 IONX",
        maxUsers: 100000,
        totalAllocation: "10,000,000 IONX"
    };

    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(__dirname, '..', 'deployments', `kyc-airdrop-${hre.network.name}.json`);

    // Create deployments directory if it doesn't exist
    const deploymentDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentPath}\n`);

    // Verification instructions
    console.log("🔍 To verify the contract on block explorer, run:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${airdrop.address} ${IONX_TOKEN_ADDRESS}\n`);

    // Next steps
    console.log("📋 NEXT STEPS:");
    console.log("   1. Verify contract on block explorer");
    console.log("   2. Fund contract with 10M IONX:");
    console.log(`      ionxToken.approve("${airdrop.address}", "10000000000000000000000000")`);
    console.log(`      airdrop.fundContract("10000000000000000000000000")`);
    console.log("   3. Add additional KYC admins if needed:");
    console.log(`      airdrop.addKYCAdmin("0x...")`);
    console.log("   4. Update frontend with contract address");
    console.log("   5. Start accepting KYC submissions!\n");

    console.log("🎉 Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
