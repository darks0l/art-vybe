import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { StakingFactoryABI } from "../config/contracts";
import { getContractAddresses } from "../config/contracts";

export function useStakingFactory(chainId: number) {
  const addresses = getContractAddresses(chainId);
  const factoryAddress = addresses?.stakingFactory as `0x${string}` | undefined;

  const { data: totalPools } = useReadContract({
    address: factoryAddress,
    abi: StakingFactoryABI,
    functionName: "totalPools",
    chainId,
    query: { enabled: !!factoryAddress && factoryAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const { data: allPools } = useReadContract({
    address: factoryAddress,
    abi: StakingFactoryABI,
    functionName: "getAllPools",
    chainId,
    query: { enabled: !!factoryAddress && factoryAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const { data: creationFee } = useReadContract({
    address: factoryAddress,
    abi: StakingFactoryABI,
    functionName: "creationFee",
    chainId,
    query: { enabled: !!factoryAddress && factoryAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const {
    data: createPoolHash,
    writeContract: createPool,
    isPending: isCreating,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: createPoolHash });

  return {
    factoryAddress,
    totalPools: totalPools as bigint | undefined,
    allPools: allPools as `0x${string}`[] | undefined,
    creationFee: creationFee as bigint | undefined,
    createPool,
    createPoolHash,
    isCreating,
    isConfirming,
    isConfirmed,
  };
}

export function usePoolsByCreator(chainId: number, creator: `0x${string}` | undefined) {
  const addresses = getContractAddresses(chainId);
  const factoryAddress = addresses?.stakingFactory as `0x${string}` | undefined;

  const { data: pools, refetch } = useReadContract({
    address: factoryAddress,
    abi: StakingFactoryABI,
    functionName: "getPoolsByCreator",
    args: creator ? [creator] : undefined,
    chainId,
    query: {
      enabled: !!factoryAddress && !!creator && factoryAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  return { pools: pools as `0x${string}`[] | undefined, refetch };
}
