const hre = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Deploying ValidatorFractionNFT...\n");

    // Configuration
    const config = {
        paymentToken: process.env.USDC_ADDRESS,
        treasury: process.env.TREASURY_ADDRESS,
        metadataUri: process.env.METADATA_URI || "https://api.ionova.network/metadata/{id}",
        saleStartTime: process.env.SALE_START_TIME || Math.floor(Date.now() / 1000),
        saleEndTime: process.env.SALE_END_TIME || Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days
        ionxToken: process.env.IONX_TOKEN_ADDRESS,
    };

    // Validate configuration
    if (!config.paymentToken || config.paymentToken === "0x0000000000000000000000000000000000000000") {
        throw new Error("USDC_ADDRESS not set in .env file");
    }
    if (!config.treasury || config.treasury === "0x0000000000000000000000000000000000000000") {
        throw new Error("TREASURY_ADDRESS not set in .env file");
    }

    console.log("📋 Configuration:");
    console.log("   Payment Token:", config.paymentToken);
    console.log("   Treasury:", config.treasury);
    console.log("   Metadata URI:", config.metadataUri);
    console.log("   Sale Start:", new Date(config.saleStartTime * 1000).toISOString());
    console.log("   Sale End:", new Date(config.saleEndTime * 1000).toISOString());
    console.log("   IONX Token:", config.ionxToken || "Not set (will configure later)");
    console.log("");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);

    const balance = await deployer.getBalance();
    console.log("💰 Balance:", hre.ethers.utils.formatEther(balance), "ETH\n");

    // Deploy
    const ValidatorFractionNFT = await hre.ethers.getContractFactory("ValidatorFractionNFT");
    console.log("⏳ Deploying contract...");

    const contract = await ValidatorFractionNFT.deploy(
        config.paymentToken,
        config.treasury,
        config.metadataUri,
        config.saleStartTime,
        config.saleEndTime
    );

    await contract.deployed();
    console.log("✅ Contract deployed to:", contract.address);
    console.log("");

    // Set IONX token if provided
    if (config.ionxToken && config.ionxToken !== "0x0000000000000000000000000000000000000000") {
        console.log("⚙️  Setting IONX token address...");
        const tx = await contract.setIonxToken(config.ionxToken);
        await tx.wait();
        console.log("✅ IONX token set\n");
    } else {
        console.log("⚠️  IONX token not set. Use setIonxToken() later.\n");
    }

    // Verification info
    console.log("📝 Verification command:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contract.address} "${config.paymentToken}" "${config.treasury}" "${config.metadataUri}" ${config.saleStartTime} ${config.saleEndTime}`);
    console.log("");

    // Save deployment info
    const deployment = {
        network: hre.network.name,
        contract: "ValidatorFractionNFT",
        address: contract.address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        config: config,
        transactionHash: contract.deployTransaction.hash,
    };

    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "../deployments", `${hre.network.name}.json`);

    // Create deployments directory if it doesn't exist
    const deploymentDir = path.dirname(deploymentPath);
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("💾 Deployment info saved to:", deploymentPath);
    console.log("");

    console.log("🎉 Deployment complete!");
    console.log("");
    console.log("⚡ Next steps:");
    console.log("   1. Verify contract on block explorer");
    console.log("   2. Set IONX token address (if not set)");
    console.log("   3. Add KYC admins via setKYCAdmin()");
    console.log("   4. Test purchase flow on testnet");
    console.log("   5. Update frontend with contract address");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
