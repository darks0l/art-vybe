require("@nomicfoundation/hardhat-toolbox");

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC || "https://eth.llamarpc.com",
      chainId: 1,
      accounts: [DEPLOYER_KEY],
    },
    bsc: {
      url: process.env.BSC_RPC || "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: [DEPLOYER_KEY],
    },
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      chainId: 8453,
      accounts: [DEPLOYER_KEY],
    },
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon-rpc.com",
      chainId: 137,
      accounts: [DEPLOYER_KEY],
    },
    avalanche: {
      url: process.env.AVALANCHE_RPC || "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [DEPLOYER_KEY],
    },
    cronos: {
      url: process.env.CRONOS_RPC || "https://evm.cronos.org",
      chainId: 25,
      accounts: [DEPLOYER_KEY],
    },
    roburna: {
      url: process.env.ROBURNA_RPC || "https://preseed-testnet-1.roburna.com",
      chainId: 158,
      accounts: [DEPLOYER_KEY],
    },
    vsc: {
      url: process.env.VSC_RPC || "https://rpc.vscchain.com",
      chainId: 420042,
      accounts: [DEPLOYER_KEY],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "cronos",
        chainId: 25,
        urls: {
          apiURL: "https://api.cronoscan.com/api",
          browserURL: "https://cronoscan.com",
        },
      },
    ],
  },
};
