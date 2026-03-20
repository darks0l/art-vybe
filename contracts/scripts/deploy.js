const hre = require("hardhat");

// USDC addresses per chain
const USDC_ADDRESSES = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",       // Ethereum
  56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",      // BSC
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",    // Base
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",     // Polygon
  43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",   // Avalanche
  25: "0xc21223249CA28397B4B6541dfFaEcc539BfF0c59",      // Cronos
  158: "0x0000000000000000000000000000000000000000",      // Roburna (native)
  420042: "0x0000000000000000000000000000000000000000",   // VSC (native)
};

// Default creation fee: 50 USDC (6 decimals) or equivalent native
const DEFAULT_FEE_USDC = 50n * 10n ** 6n;           // 50 USDC
const DEFAULT_FEE_NATIVE = 50n * 10n ** 18n;         // 50 native tokens

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

  console.log("=".repeat(60));
  console.log("Art Vybe — Deploying contracts");
  console.log(`  Chain ID : ${chainId}`);
  console.log(`  Deployer : ${deployer.address}`);
  console.log("=".repeat(60));

  // 1. Deploy FeeCollector
  const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
  const feeCollector = await FeeCollector.deploy(deployer.address);
  await feeCollector.waitForDeployment();
  const feeCollectorAddr = await feeCollector.getAddress();
  console.log(`FeeCollector deployed to: ${feeCollectorAddr}`);

  // 2. Deploy StakingPool implementation
  const StakingPool = await hre.ethers.getContractFactory("StakingPool");
  const stakingPoolImpl = await StakingPool.deploy();
  await stakingPoolImpl.waitForDeployment();
  const stakingPoolImplAddr = await stakingPoolImpl.getAddress();
  console.log(`StakingPool (impl) deployed to: ${stakingPoolImplAddr}`);

  // 3. Determine fee token and amount
  const usdcAddress = USDC_ADDRESSES[chainId] || USDC_ADDRESSES[1];
  const isNativeFee = usdcAddress === "0x0000000000000000000000000000000000000000";
  const feeToken = isNativeFee ? "0x0000000000000000000000000000000000000000" : usdcAddress;
  const creationFee = isNativeFee ? DEFAULT_FEE_NATIVE : DEFAULT_FEE_USDC;

  // 4. Deploy StakingFactory
  const StakingFactory = await hre.ethers.getContractFactory("StakingFactory");
  const stakingFactory = await StakingFactory.deploy(
    stakingPoolImplAddr,
    feeCollectorAddr,
    feeToken,
    creationFee
  );
  await stakingFactory.waitForDeployment();
  const stakingFactoryAddr = await stakingFactory.getAddress();
  console.log(`StakingFactory deployed to: ${stakingFactoryAddr}`);

  console.log("\n" + "=".repeat(60));
  console.log("Deployment complete!");
  console.log(`  FeeCollector   : ${feeCollectorAddr}`);
  console.log(`  StakingPool    : ${stakingPoolImplAddr} (implementation)`);
  console.log(`  StakingFactory : ${stakingFactoryAddr}`);
  console.log(`  Fee token      : ${isNativeFee ? "NATIVE" : feeToken}`);
  console.log(`  Creation fee   : ${creationFee.toString()}`);
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
