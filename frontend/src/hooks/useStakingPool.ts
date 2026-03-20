import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { StakingPoolABI } from "../config/contracts";

export function useStakingPool(poolAddress: `0x${string}` | undefined, chainId?: number) {
  const enabled = !!poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000";

  const { data: poolInfo, refetch: refetchPoolInfo } = useReadContract({
    address: poolAddress,
    abi: StakingPoolABI,
    functionName: "getPoolInfo",
    chainId,
    query: { enabled },
  });

  const { data: totalStaked } = useReadContract({
    address: poolAddress,
    abi: StakingPoolABI,
    functionName: "totalStaked",
    chainId,
    query: { enabled },
  });

  const { data: isExpired } = useReadContract({
    address: poolAddress,
    abi: StakingPoolABI,
    functionName: "isExpired",
    chainId,
    query: { enabled },
  });

  const { data: currentAPR } = useReadContract({
    address: poolAddress,
    abi: StakingPoolABI,
    functionName: "getCurrentAPR",
    chainId,
    query: { enabled },
  });

  return {
    poolInfo,
    totalStaked: totalStaked as bigint | undefined,
    isExpired: isExpired as boolean | undefined,
    currentAPR: currentAPR as bigint | undefined,
    refetchPoolInfo,
  };
}

export function useStakerInfo(
  poolAddress: `0x${string}` | undefined,
  staker: `0x${string}` | undefined,
  chainId?: number
) {
  const enabled =
    !!poolAddress &&
    !!staker &&
    poolAddress !== "0x0000000000000000000000000000000000000000";

  const { data: stakerInfo, refetch } = useReadContract({
    address: poolAddress,
    abi: StakingPoolABI,
    functionName: "getStakerInfo",
    args: staker ? [staker] : undefined,
    chainId,
    query: { enabled },
  });

  const { data: earnedAmount, refetch: refetchEarned } = useReadContract({
    address: poolAddress,
    abi: StakingPoolABI,
    functionName: "earned",
    args: staker ? [staker] : undefined,
    chainId,
    query: { enabled },
  });

  return {
    stakerInfo,
    earnedAmount: earnedAmount as bigint | undefined,
    refetch,
    refetchEarned,
  };
}

export function usePoolActions() {
  const {
    data: stakeHash,
    writeContract: stakeWrite,
    isPending: isStaking,
  } = useWriteContract();

  const {
    data: unstakeHash,
    writeContract: unstakeWrite,
    isPending: isUnstaking,
  } = useWriteContract();

  const {
    data: claimHash,
    writeContract: claimWrite,
    isPending: isClaiming,
  } = useWriteContract();

  const { isLoading: stakeConfirming, isSuccess: stakeConfirmed } =
    useWaitForTransactionReceipt({ hash: stakeHash });

  const { isLoading: unstakeConfirming, isSuccess: unstakeConfirmed } =
    useWaitForTransactionReceipt({ hash: unstakeHash });

  const { isLoading: claimConfirming, isSuccess: claimConfirmed } =
    useWaitForTransactionReceipt({ hash: claimHash });

  const stake = (poolAddress: `0x${string}`, tokenIds: bigint[]) => {
    stakeWrite({
      address: poolAddress,
      abi: StakingPoolABI,
      functionName: "stake",
      args: [tokenIds],
    });
  };

  const unstake = (poolAddress: `0x${string}`, tokenIds: bigint[]) => {
    unstakeWrite({
      address: poolAddress,
      abi: StakingPoolABI,
      functionName: "unstake",
      args: [tokenIds],
    });
  };

  const claim = (poolAddress: `0x${string}`) => {
    claimWrite({
      address: poolAddress,
      abi: StakingPoolABI,
      functionName: "claimRewards",
    });
  };

  return {
    stake,
    unstake,
    claim,
    isStaking,
    isUnstaking,
    isClaiming,
    stakeConfirming,
    unstakeConfirming,
    claimConfirming,
    stakeConfirmed,
    unstakeConfirmed,
    claimConfirmed,
  };
}
