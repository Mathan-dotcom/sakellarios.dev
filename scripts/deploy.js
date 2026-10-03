/**
 * Vestiarion AI - Arc Testnet Contract Deployment Script
 * Deploys PolicyWallet.sol onto Arc L1 with initial parameters:
 * Daily Limit: 1000 USDC, Single Tx Cap: 250 USDC.
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    const rpcUrl = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.circle.com";
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!privateKey) {
        console.log("[Deployer] Notice: DEPLOYER_PRIVATE_KEY not set in .env. Running in dry-run simulation mode.");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`[Deployer] Deploying PolicyWallet.sol from address: ${wallet.address}`);

    const artifactPath = path.join(__dirname, "..", "out", "PolicyWallet.sol", "PolicyWallet.json");
    if (!fs.existsSync(artifactPath)) {
        throw new Error("Compilation artifact not found. Please run 'npm run build:contracts' first.");
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object, wallet);

    const usdcAddress = process.env.ARC_USDC_ADDRESS || "0x0000000000000000000000000000000000000001";
    const usycVaultAddress = process.env.ARC_USYC_VAULT_ADDRESS || "0x0000000000000000000000000000000000000002";
    const agentAddress = process.env.AGENT_ADDRESS || wallet.address;
    const dailyLimit = 1000 * 10**6; // 1,000 USDC
    const maxSingleTx = 250 * 10**6; // 250 USDC

    console.log(`[Deployer] Constructor parameters:
      USDC: ${usdcAddress}
      USYC Vault: ${usycVaultAddress}
      Agent: ${agentAddress}
      Daily Limit: ${dailyLimit / 1e6} USDC
      Max Single Tx: ${maxSingleTx / 1e6} USDC
    `);

    const contract = await factory.deploy(usdcAddress, usycVaultAddress, agentAddress, dailyLimit, maxSingleTx);
    await contract.waitForDeployment();

    const deployedAddress = await contract.getAddress();
    console.log(`🎉 PolicyWallet deployed successfully at: ${deployedAddress}`);
}

main().catch(err => {
    console.error("[Deployer] Deployment error:", err);
    process.exit(1);
});
