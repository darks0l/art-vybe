import { useReadContract } from "wagmi";
import { ERC721_ABI, ERC20_ABI } from "../config/contracts";

export function useNFTCollection(address: `0x${string}` | undefined, chainId?: number) {
  const enabled = !!address && address !== "0x0000000000000000000000000000000000000000";

  const { data: name } = useReadContract({
    address,
    abi: ERC721_ABI,
    functionName: "name",
    chainId,
    query: { enabled },
  });

  const { data: symbol } = useReadContract({
    address,
    abi: ERC721_ABI,
    functionName: "symbol",
    chainId,
    query: { enabled },
  });

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
  };
}

export function useNFTBalance(
  collectionAddress: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  chainId?: number
) {
  const enabled = !!collectionAddress && !!owner &&
    collectionAddress !== "0x0000000000000000000000000000000000000000";

  const { data: balance } = useReadContract({
    address: collectionAddress,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    chainId,
    query: { enabled },
  });

  return { balance: balance as bigint | undefined };
}

export function useTokenInfo(address: `0x${string}` | undefined, chainId?: number) {
  const enabled = !!address && address !== "0x0000000000000000000000000000000000000000";

  const { data: name } = useReadContract({
    address,
    abi: ERC20_ABI,
    functionName: "name",
    chainId,
    query: { enabled },
  });

  const { data: symbol } = useReadContract({
    address,
    abi: ERC20_ABI,
    functionName: "symbol",
    chainId,
    query: { enabled },
  });

  const { data: decimals } = useReadContract({
    address,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId,
    query: { enabled },
  });

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    decimals: decimals as number | undefined,
  };
}

export function useERC721Approval(
  collectionAddress: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  operator: `0x${string}` | undefined,
  chainId?: number
) {
  const enabled = !!collectionAddress && !!owner && !!operator;

  const { data: isApproved, refetch } = useReadContract({
    address: collectionAddress,
    abi: ERC721_ABI,
    functionName: "isApprovedForAll",
    args: owner && operator ? [owner, operator] : undefined,
    chainId,
    query: { enabled },
  });

  return { isApproved: isApproved as boolean | undefined, refetch };
}
