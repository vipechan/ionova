const hre = require("hardhat");

async function main() {
    console.log("Deploying IonoPay Payment System...\n");

    // Deploy MerchantRegistry first
    console.log("1. Deploying MerchantRegistry...");
    const MerchantRegistry = await hre.ethers.getContractFactory("MerchantRegistry");
    const merchantRegistry = await MerchantRegistry.deploy();
    await merchantRegistry.waitForDeployment();
    const merchantRegistryAddress = await merchantRegistry.getAddress();
    console.log(`✅ MerchantRegistry deployed to: ${merchantRegistryAddress}\n`);

    // Deploy IonoPay
    console.log("2. Deploying IonoPay...");
    const IonoPay = await hre.ethers.getContractFactory("IonoPay");
    const ionoPay = await IonoPay.deploy();
    await ionoPay.waitForDeployment();
    const ionoPayAddress = await ionoPay.getAddress();
    console.log(`✅ IonoPay deployed to: ${ionoPayAddress}\n`);

    // Deploy PaymentChannel
    console.log("3. Deploying PaymentChannel...");
    const PaymentChannel = await hre.ethers.getContractFactory("PaymentChannel");
    const paymentChannel = await PaymentChannel.deploy();
    await paymentChannel.waitForDeployment();
    const paymentChannelAddress = await paymentChannel.getAddress();
    console.log(`✅ PaymentChannel deployed to: ${paymentChannelAddress}\n`);

    // Display deployment summary
    console.log("=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`MerchantRegistry: ${merchantRegistryAddress}`);
    console.log(`IonoPay:          ${ionoPayAddress}`);
    console.log(`PaymentChannel:   ${paymentChannelAddress}`);
    console.log("=".repeat(60));

    // Save deployment addresses
    const fs = require('fs');
    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        contracts: {
            MerchantRegistry: merchantRegistryAddress,
            IonoPay: ionoPayAddress,
            PaymentChannel: paymentChannelAddress
        }
    };

    fs.writeFileSync(
        'deployments/ionopay-deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ Deployment info saved to deployments/ionopay-deployment.json");

    // Verify contracts on Etherscan (if not local network)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("\nWaiting for block confirmations...");
        await ionoPay.deploymentTransaction().wait(6);

        console.log("\nVerifying contracts on Etherscan...");

        try {
            await hre.run("verify:verify", {
                address: merchantRegistryAddress,
                constructorArguments: [],
            });
            console.log("✅ MerchantRegistry verified");
        } catch (error) {
            console.log("❌ MerchantRegistry verification failed:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: ionoPayAddress,
                constructorArguments: [],
            });
            console.log("✅ IonoPay verified");
        } catch (error) {
            console.log("❌ IonoPay verification failed:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: paymentChannelAddress,
                constructorArguments: [],
            });
            console.log("✅ PaymentChannel verified");
        } catch (error) {
            console.log("❌ PaymentChannel verification failed:", error.message);
        }
    }

    console.log("\n🎉 IonoPay deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
