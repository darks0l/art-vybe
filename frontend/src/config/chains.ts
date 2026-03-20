import {
  mainnet,
  bsc,
  base,
  polygon,
  avalanche,
  cronos,
  type Chain,
} from "viem/chains";

// Custom chain: Roburna
export const roburna: Chain = {
  id: 158,
  name: "Roburna",
  nativeCurrency: { name: "Roburna", symbol: "RBA", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://preseed-testnet-1.roburna.com"] },
  },
  blockExplorers: {
    default: { name: "Roburna Explorer", url: "https://rbascan.com" },
  },
};

// Custom chain: VSC (Vector Smart Chain)
export const vsc: Chain = {
  id: 420042,
  name: "Vector Smart Chain",
  nativeCurrency: { name: "VSC", symbol: "VSC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.vscchain.com"] },
  },
  blockExplorers: {
    default: { name: "VSC Explorer", url: "https://explorer.vscchain.com" },
  },
};

export const supportedChains = [
  mainnet,
  bsc,
  base,
  polygon,
  avalanche,
  cronos,
  roburna,
  vsc,
] as const;

export type SupportedChainId = (typeof supportedChains)[number]["id"];

export interface ChainConfig {
  chain: Chain;
  name: string;
  shortName: string;
  icon: string;
  usdcAddress: `0x${string}` | null;
  isNativeFee: boolean;
  color: string;
}

export const chainConfigs: Record<number, ChainConfig> = {
  1: {
    chain: mainnet,
    name: "Ethereum",
    shortName: "ETH",
    icon: "/chains/ethereum.svg",
    usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    isNativeFee: false,
    color: "#627EEA",
  },
  56: {
    chain: bsc,
    name: "BNB Smart Chain",
    shortName: "BSC",
    icon: "/chains/bsc.svg",
    usdcAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    isNativeFee: false,
    color: "#F0B90B",
  },
  8453: {
    chain: base,
    name: "Base",
    shortName: "BASE",
    icon: "/chains/base.svg",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    isNativeFee: false,
    color: "#0052FF",
  },
  137: {
    chain: polygon,
    name: "Polygon",
    shortName: "MATIC",
    icon: "/chains/polygon.svg",
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    isNativeFee: false,
    color: "#8247E5",
  },
  43114: {
    chain: avalanche,
    name: "Avalanche",
    shortName: "AVAX",
    icon: "/chains/avalanche.svg",
    usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    isNativeFee: false,
    color: "#E84142",
  },
  25: {
    chain: cronos,
    name: "Cronos",
    shortName: "CRO",
    icon: "/chains/cronos.svg",
    usdcAddress: "0xc21223249CA28397B4B6541dfFaEcc539BfF0c59",
    isNativeFee: false,
    color: "#002D74",
  },
  158: {
    chain: roburna,
    name: "Roburna",
    shortName: "RBA",
    icon: "/chains/roburna.svg",
    usdcAddress: null,
    isNativeFee: true,
    color: "#FF6B35",
  },
  420042: {
    chain: vsc,
    name: "Vector Smart Chain",
    shortName: "VSC",
    icon: "/chains/vsc.svg",
    usdcAddress: null,
    isNativeFee: true,
    color: "#00D4AA",
  },
};

export const getChainConfig = (chainId: number): ChainConfig | undefined =>
  chainConfigs[chainId];

export const chainList = Object.values(chainConfigs);
