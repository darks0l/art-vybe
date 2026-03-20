import { Link } from "react-router-dom";
import { formatEther } from "viem";
import { motion } from "framer-motion";
import { useReadContract } from "wagmi";
import { useStakingPool } from "../hooks/useStakingPool";
import { useNFTCollection, useTokenInfo } from "../hooks/useNFTs";
import { StakingFactoryABI, getContractAddresses } from "../config/contracts";

interface PoolCardProps {
  address: `0x${string}`;
  chainId: number;
  index?: number;
}

export default function PoolCard({ address, chainId, index = 0 }: PoolCardProps) {
  const { poolInfo, totalStaked, currentAPR, isExpired } = useStakingPool(address, chainId);

  const poolData = poolInfo as
    | readonly [string, string, bigint, bigint, bigint, bigint, bigint, bigint, string, bigint]
    | undefined;

  const nftAddress = poolData?.[0] as `0x${string}` | undefined;
  const rewardTokenAddress = poolData?.[1] as `0x${string}` | undefined;
  const totalRewards = poolData?.[2];
  const endTime = poolData?.[6];
  const lockPeriodSeconds = poolData?.[9];

  // Factory metadata
  const contracts = getContractAddresses(chainId);
  const { data: factoryPoolInfo } = useReadContract({
    address: contracts?.stakingFactory,
    abi: StakingFactoryABI,
    functionName: "getPoolInfo",
    args: [address],
    query: { enabled: !!contracts },
  });

  const factoryInfo = factoryPoolInfo as {
    name: string;
    description: string;
    logoUrl: string;
    lockPeriodDays: bigint;
  } | undefined;

  const poolName = factoryInfo?.name;
  const logoUrl = factoryInfo?.logoUrl;
  const lockDays = factoryInfo?.lockPeriodDays ? Number(factoryInfo.lockPeriodDays) : 0;

  const { name: collectionName } = useNFTCollection(nftAddress, chainId);
  const { symbol: rewardSymbol } = useTokenInfo(rewardTokenAddress, chainId);

  const timeRemaining = endTime
    ? Number(endTime) - Math.floor(Date.now() / 1000)
    : 0;
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / 86400));

  const aprDisplay = currentAPR
    ? `${Number(formatEther(currentAPR)).toFixed(2)}`
    : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/pool/${address}`}>
        <div className="glass-card-hover p-6 h-full">
          {/* Header with Logo */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={poolName || "Pool"}
                  className="w-10 h-10 rounded-xl object-cover border border-dark-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple/20 to-dark-600 flex items-center justify-center">
                  <span className="text-lg">🎨</span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {poolName || collectionName || "Loading..."}
                </h3>
                <p className="text-gray-600 text-xs font-mono">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isExpired ? (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  Expired
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  Active
                </span>
              )}
              {lockDays > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  🔒 {lockDays}d
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                APR
              </p>
              <p className="text-purple font-bold text-xl mt-1">
                {aprDisplay}
                <span className="text-sm text-gray-500 ml-1">
                  {rewardSymbol || "tokens"}/NFT/yr
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Total Staked
              </p>
              <p className="text-white font-semibold text-xl mt-1">
                {totalStaked?.toString() || "0"}
                <span className="text-sm text-gray-500 ml-1">NFTs</span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Rewards
              </p>
              <p className="text-white font-medium text-sm mt-1">
                {totalRewards
                  ? Number(formatEther(totalRewards)).toLocaleString()
                  : "0"}{" "}
                {rewardSymbol || ""}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">
                Time Left
              </p>
              <p className="text-white font-medium text-sm mt-1">
                {daysRemaining > 0 ? `${daysRemaining} days` : "Ended"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-dark-600 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-purple-dark to-purple h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, (daysRemaining / 365) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
