// SPDX-License-Identifier: MIT
// CREATE2 Deterministic Deployment Script
// Deploys all contracts to the SAME address across all chains
//
// Uses the Deterministic Deployment Proxy (0x4e59b44847b379578588920cA78FbF26c0B4956C)
// which is pre-deployed on most EVM chains.
//
// Usage:
//   npx hardhat run scripts/deploy-create2.js --network <chain>
//
// Run on each chain to get identical addresses.

const { ethers } = require("hardhat");

// Deterministic Deployment Proxy (Nick's method)
// Pre-deployed at this address on ETH, BSC, Base, Polygon, AVAX, Cronos, etc.
const CREATE2_FACTORY = "0x4e59b44847b379578588920cA78FbF26c0B4956C";

// Fixed salt — change this to redeploy at new addresses
const SALT = ethers.zeroPadValue(ethers.toBeHex(0xA47_VYBE), 32);

// Chain-specific config
const CHAIN_CONFIG = {
  1:      { name: "Ethereum",  usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", feeNative: false },
  56:     { name: "BSC",       usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", feeNative: false },
  8453:   { name: "Base",      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", feeNative: false },
  137:    { name: "Polygon",   usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", feeNative: false },
  43114:  { name: "Avalanche", usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", feeNative: false },
  25:     { name: "Cronos",    usdc: "0xc21223249CA28397B4B6541dfFaEcc539BfF0c59", feeNative: false },
  158:    { name: "Roburna",   usdc: ethers.ZeroAddress,                             feeNative: true  },
  420042: { name: "VSC",       usdc: ethers.ZeroAddress,                             feeNative: true  },
};

// Default creation fee: 50 USDC (6 decimals) or 0.1 native
const USDC_FEE = 50_000_000n; // 50 USDC
const NATIVE_FEE = ethers.parseEther("0.1"); // 0.1 native token

async function getCreate2Address(factory, salt, bytecode) {
  return ethers.getCreate2Address(factory, salt, ethers.keccak256(bytecode));
}

async function deployWithCreate2(contractName, constructorArgs = []) {
  const Factory = await ethers.getContractFactory(contractName);
  const bytecode = Factory.bytecode + Factory.interface.encodeDeploy(constructorArgs).slice(2);

  const predictedAddress = await getCreate2Address(CREATE2_FACTORY, SALT, bytecode);
  console.log(`  Predicted ${contractName}: ${predictedAddress}`);

  // Check if already deployed
  const code = await ethers.provider.getCode(predictedAddress);
  if (code !== "0x") {
    console.log(`  ✓ Already deployed at ${predictedAddress}`);
    return predictedAddress;
  }

  // Deploy via CREATE2 factory
  const [deployer] = await ethers.getSigners();
  const tx = await deployer.sendTransaction({
    to: CREATE2_FACTORY,
    data: SALT + bytecode.slice(2),
    gasLimit: 5_000_000,
  });
  await tx.wait();
  console.log(`  ✓ Deployed ${contractName} at ${predictedAddress} (tx: ${tx.hash})`);

  return predictedAddress;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const config = CHAIN_CONFIG[chainId];
  if (!config) {
    console.error(`Unknown chain ID: ${chainId}. Add it to CHAIN_CONFIG.`);
    process.exit(1);
  }

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  Art Vybe — CREATE2 Deterministic Deploy  ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Chain:    ${config.name.padEnd(28)} ║`);
  console.log(`║  ChainId:  ${String(chainId).padEnd(28)} ║`);
  console.log(`║  Deployer: ${deployer.address.slice(0, 20)}...  ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  // 1. Deploy FeeCollector
  console.log("1. Deploying FeeCollector...");
  const feeCollectorAddr = await deployWithCreate2("FeeCollector", [deployer.address]);

  // 2. Deploy StakingPool implementation
  console.log("\n2. Deploying StakingPool (implementation)...");
  const poolImplAddr = await deployWithCreate2("StakingPool", []);

  // 3. Deploy StakingFactory
  const feeToken = config.feeNative ? ethers.ZeroAddress : config.usdc;
  const creationFee = config.feeNative ? NATIVE_FEE : USDC_FEE;

  console.log(`\n3. Deploying StakingFactory...`);
  console.log(`   Fee token: ${config.feeNative ? "NATIVE" : "USDC (" + feeToken + ")"}`);
  console.log(`   Fee amount: ${config.feeNative ? ethers.formatEther(creationFee) + " native" : "50 USDC"}`);
  const factoryAddr = await deployWithCreate2("StakingFactory", [
    poolImplAddr,
    feeCollectorAddr,
    feeToken,
    creationFee,
  ]);

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  DEPLOYMENT SUMMARY (${config.name})`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  FeeCollector:     ${feeCollectorAddr}`);
  console.log(`  StakingPool impl: ${poolImplAddr}`);
  console.log(`  StakingFactory:   ${factoryAddr}`);
  console.log(`${"═".repeat(50)}`);
  console.log(`\n  These addresses will be IDENTICAL on all chains.`);
  console.log(`  Run this script on each chain to deploy.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
