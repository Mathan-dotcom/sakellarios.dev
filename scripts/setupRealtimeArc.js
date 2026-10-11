/**
 * Complete Real-Time Arc Testnet Integration & Whitelisting
 * Uses already deployed contracts:
 * PolicyWallet: 0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0
 * USYC Vault:   0xD9331d5C68e5cf3905BafAD867Fb26572E2153aC
 * Agent Wallet: 0x97aB6e781F034a8Cd0b60b1c6EA5a072529e8665
 */

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("=================================================");
    console.log("🚀 Finalizing Real-Time Arc Testnet Configuration");
    console.log("=================================================\n");

    const rpcUrl = "https://rpc.testnet.arc.io";
    const chainId = 5042002;
    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });

    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
    const deployer = new ethers.Wallet(deployerKey, provider);
    console.log(`[Deployer / Owner] Address: ${deployer.address}`);

    const usdcAddress = "0x3600000000000000000000000000000000000000";
    const usycAddress = "0xD9331d5C68e5cf3905BafAD867Fb26572E2153aC";
    const policyAddress = "0xB9087E75D7DDE6138BF5673Ad36f4AcDb1806aD0";
    const agentAddress = "0x97aB6e781F034a8Cd0b60b1c6EA5a072529e8665";

    // 1. Fund PolicyWallet with 2.0 USDC via ERC-20 transfer
    console.log("[1/3] Transferring 2.0 USDC to PolicyWallet...");
    const usdcAbi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
    ];
    const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, deployer);
    const amountUsdc = ethers.parseUnits("2.0", 6);

    const txTransfer = await usdcContract.transfer(policyAddress, amountUsdc);
    await txTransfer.wait();
    console.log(`  ✓ Transferred 2.0 USDC to PolicyWallet! Tx: ${txTransfer.hash}`);

    const walletUsdcBal = await usdcContract.balanceOf(policyAddress);
    console.log(`  ✓ PolicyWallet Live Balance: ${ethers.formatUnits(walletUsdcBal, 6)} USDC`);

    // 2. Whitelist Authorized Vendors On-Chain in PolicyWallet
    console.log("\n[2/3] Whitelisting Authorized Vendors in PolicyWallet...");
    const policyArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "out", "PolicyWallet.sol", "PolicyWallet.json"), "utf8")
    );
    const policyContract = new ethers.Contract(policyAddress, policyArtifact.abi, deployer);

    const vendors = [
        "0x3333333333333333333333333333333333333333", // Cloud Ops (Infrastructure)
        "0x4444444444444444444444444444444444444444", // Dev Contributor (Payroll)
        "0x6666666666666666666666666666666666666666", // Partner Alpha (Vendor)
        "0x7777777777777777777777777777777777777777"  // Anthropic API (SaaS)
    ];

    for (const v of vendors) {
        const isAlreadyWl = await policyContract.whitelistedVendors(v);
        if (!isAlreadyWl) {
            const wlTx = await policyContract.setVendorWhitelist(v, true);
            await wlTx.wait();
            console.log(`  ✓ Whitelisted on-chain: ${v}`);
        } else {
            console.log(`  ✓ Already whitelisted: ${v}`);
        }
    }

    // 3. Update .env file
    console.log("\n[3/3] Updating .env with Live Testnet Deployment...");
    let envContent = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");

    envContent = envContent.replace(/^ARC_RPC_URL=.*/m, `ARC_RPC_URL=${rpcUrl}`);
    envContent = envContent.replace(/^ARC_CHAIN_ID=.*/m, `ARC_CHAIN_ID=${chainId}`);
    envContent = envContent.replace(/^ARC_USDC_ADDRESS=.*/m, `ARC_USDC_ADDRESS=${usdcAddress}`);
    envContent = envContent.replace(/^ARC_USYC_VAULT_ADDRESS=.*/m, `ARC_USYC_VAULT_ADDRESS=${usycAddress}`);
    envContent = envContent.replace(/^POLICY_WALLET_ADDRESS=.*/m, `POLICY_WALLET_ADDRESS=${policyAddress}`);
    envContent = envContent.replace(/^AGENT_ADDRESS=.*/m, `AGENT_ADDRESS=${agentAddress}`);
    envContent = envContent.replace(/^OWNER_ADDRESS=.*/m, `OWNER_ADDRESS=${deployer.address}`);

    fs.writeFileSync(path.join(__dirname, "..", ".env"), envContent, "utf8");
    console.log("  ✓ .env successfully updated!");

    console.log("\n=================================================");
    console.log("🎉 REAL-TIME ARC TESTNET LIVE CONFIGURATION READY!");
    console.log(`   PolicyWallet: ${policyAddress}`);
    console.log(`   USDC Contract: ${usdcAddress}`);
    console.log(`   USYC Vault:   ${usycAddress}`);
    console.log(`   Agent Wallet: ${agentAddress}`);
    console.log(`   Owner Wallet: ${deployer.address}`);
    console.log("=================================================");
}

main().catch(err => {
    console.error("Setup error:", err);
    process.exit(1);
});
