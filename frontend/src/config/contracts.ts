import StakingFactoryABI from "../abi/StakingFactory.json";
import StakingPoolABI from "../abi/StakingPool.json";
import FeeCollectorABI from "../abi/FeeCollector.json";

export { StakingFactoryABI, StakingPoolABI, FeeCollectorABI };

// Contract addresses per chain — fill in after deployment
export const CONTRACT_ADDRESSES: Record<
  number,
  {
    stakingFactory: `0x${string}`;
    feeCollector: `0x${string}`;
    stakingPoolImpl: `0x${string}`;
  }
> = {
  1: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  56: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  8453: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  137: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  43114: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  25: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  158: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
  420042: {
    stakingFactory: "0x0000000000000000000000000000000000000000",
    feeCollector: "0x0000000000000000000000000000000000000000",
    stakingPoolImpl: "0x0000000000000000000000000000000000000000",
  },
};

export const getContractAddresses = (chainId: number) =>
  CONTRACT_ADDRESSES[chainId];

// Standard ERC-20 ABI (minimal, for approval + balance)
export const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Standard ERC-721 ABI (minimal)
export const ERC721_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "interfaceId", type: "bytes4" },
    ],
    name: "supportsInterface",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
