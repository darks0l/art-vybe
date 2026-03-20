import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatEther } from "viem";
import { useAccount, useReadContract } from "wagmi";
import toast from "react-hot-toast";
import { useStakingPool, useStakerInfo, usePoolActions } from "../hooks/useStakingPool";
import { useNFTCollection, useTokenInfo } from "../hooks/useNFTs";
import NFTCard from "../components/NFTCard";
import StakeModal from "../components/StakeModal";
import { StakingFactoryABI, getContractAddresses } from "../config/contracts";

export default function PoolDetail() {
  const { address: poolAddress } = useParams<{ address: string }>();
  const { address: userAddress, chainId } = useAccount();
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);

  const pool = poolAddress as `0x${string}` | undefined;

  const { poolInfo, totalStaked, currentAPR, isExpired } = useStakingPool(pool, chainId);
  const { stakerInfo, earnedAmount, refetchEarned } = useStakerInfo(pool, userAddress, chainId);
  const { stake, unstake, claim, isStaking, isUnstaking, isClaiming, stakeConfirming, unstakeConfirming, claimConfirming } = usePoolActions();

  // Pool on-chain data (from StakingPool contract)
  const poolData = poolInfo as
    | readonly [string, string, bigint, bigint, bigint, bigint, bigint, bigint, string, bigint]
    | undefined;

  const nftAddress = poolData?.[0] as `0x${string}` | undefined;
  const rewardTokenAddress = poolData?.[1] as `0x${string}` | undefined;
  const totalRewards = poolData?.[2];
  const startTime = poolData?.[5];
  const endTime = poolData?.[6];
  const remainingRewards = poolData?.[7];
  const poolOwner = poolData?.[8];
  const lockPeriodSeconds = poolData?.[9];

  // Factory metadata (name, description, logo)
  const contracts = chainId ? getContractAddresses(chainId) : undefined;
  const { data: factoryPoolInfo } = useReadContract({
    address: contracts?.stakingFactory,
    abi: StakingFactoryABI,
    functionName: "getPoolInfo",
    args: pool ? [pool] : undefined,
    query: { enabled: !!pool && !!contracts },
  });

  const factoryInfo = factoryPoolInfo as {
    pool: string;
    creator: string;
    nftCollection: string;
    rewardToken: string;
    totalRewards: bigint;
    lockPeriodDays: bigint;
    createdAt: bigint;
    name: string;
    description: string;
    logoUrl: string;
  } | undefined;

  const poolName = factoryInfo?.name;
  const poolDescription = factoryInfo?.description;
  const logoUrl = factoryInfo?.logoUrl;
  const lockPeriodDays = factoryInfo?.lockPeriodDays ? Number(factoryInfo.lockPeriodDays) : 0;
  const createdAt = factoryInfo?.createdAt ? Number(factoryInfo.createdAt) : 0;

  const { name: collectionName, symbol: collectionSymbol } = useNFTCollection(nftAddress, chainId);
  const { symbol: rewardSymbol } = useTokenInfo(rewardTokenAddress, chainId);

  // Staker data (5-tuple with lock info)
  const stakerData = stakerInfo as
    | readonly [bigint, bigint, readonly bigint[], boolean, bigint]
    | undefined;
  const stakedCount = stakerData?.[0];
  const stakedTokenIds = stakerData?.[2] ? [...stakerData[2]] : [];
  const isLocked = stakerData?.[3] ?? false;
  const lockEndsAt = stakerData?.[4] ? Number(stakerData[4]) : 0;

  const timeRemaining = endTime ? Number(endTime) - Math.floor(Date.now() / 1000) : 0;
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / 86400));
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % 86400) / 3600));
  const poolProgress = endTime && startTime
    ? Math.min(100, ((Date.now() / 1000 - Number(startTime)) / (Number(endTime) - Number(startTime))) * 100)
    : 0;

  const aprDisplay = currentAPR ? Number(formatEther(currentAPR)).toFixed(2) : "0";

  const lockTimeRemaining = lockEndsAt > 0 ? lockEndsAt - Math.floor(Date.now() / 1000) : 0;
  const lockDaysLeft = Math.max(0, Math.floor(lockTimeRemaining / 86400));
  const lockHoursLeft = Math.max(0, Math.floor((lockTimeRemaining % 86400) / 3600));

  const handleStake = (ids: bigint[]) => {
    if (!pool) return;
    stake(pool, ids);
    toast.loading("Staking NFTs...", { id: "stake" });
    setStakeModalOpen(false);
  };

  const handleUnstake = (ids: bigint[]) => {
    if (!pool) return;
    if (isLocked) {
      const confirmed = window.confirm(
        "⚠️ Your stake is still locked! Early withdrawal will forfeit all pending rewards. Continue?"
      );
      if (!confirmed) return;
    }
    unstake(pool, ids);
    toast.loading("Unstaking NFTs...", { id: "unstake" });
    setUnstakeModalOpen(false);
  };

  const handleClaim = () => {
    if (!pool) return;
    claim(pool);
    toast.loading("Claiming rewards...", { id: "claim" });
  };

  if (!pool) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Pool not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-purple transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </Link>

      {/* Header with Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-5">
            {/* Pool Logo */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={poolName || "Pool"}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-dark-500 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple/20 to-dark-600 border-2 border-dark-500 flex items-center justify-center">
                <span className="text-3xl">🎨</span>
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-white">
                {poolName || collectionName || "Staking Pool"}
              </h1>
              {poolDescription && (
                <p className="text-gray-400 mt-2 max-w-xl">{poolDescription}</p>
              )}
              <p className="text-gray-600 font-mono text-xs mt-2">
                {pool}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {isExpired ? (
              <span className="px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                Pool Expired
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                Active
              </span>
            )}
            {lockPeriodDays > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm">
                🔒 {lockPeriodDays}d lock
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Pool Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Current APR"
          value={aprDisplay}
          suffix={`${rewardSymbol || "tokens"}/NFT/yr`}
          highlight
        />
        <StatCard
          label="Total Staked"
          value={totalStaked?.toString() || "0"}
          suffix="NFTs"
        />
        <StatCard
          label="Total Rewards"
          value={
            totalRewards
              ? Number(formatEther(totalRewards)).toLocaleString()
              : "0"
          }
          suffix={rewardSymbol || ""}
        />
        <StatCard
          label="Time Remaining"
          value={daysRemaining > 0 ? `${daysRemaining}d ${hoursRemaining}h` : "Ended"}
          suffix=""
        />
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Pool Progress</span>
          <span className="text-sm text-purple font-medium">
            {poolProgress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-dark-600 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-dark to-purple h-3 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, poolProgress)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            {createdAt > 0
              ? new Date(createdAt * 1000).toLocaleDateString()
              : "Started"}
          </span>
          <span>1 Year</span>
        </div>
      </motion.div>

      {/* Lock Warning (if user is locked) */}
      {isLocked && stakedCount !== undefined && stakedCount > 0n && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-amber-400 font-medium">
                Your stake is locked for {lockDaysLeft}d {lockHoursLeft}h
              </p>
              <p className="text-gray-500 text-sm">
                Early withdrawal will forfeit all pending rewards. You can still claim earned rewards without unstaking.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staked NFTs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Your Staked NFTs</h2>
            <div className="flex gap-3">
              {!isExpired && (
                <button
                  onClick={() => setStakeModalOpen(true)}
                  className="btn-primary text-sm px-4 py-2"
                  disabled={!userAddress}
                >
                  Stake
                </button>
              )}
              <button
                onClick={() => setUnstakeModalOpen(true)}
                disabled={!stakedTokenIds.length}
                className={`btn-secondary text-sm px-4 py-2 ${
                  isLocked ? "border-amber-500/30 text-amber-400" : ""
                }`}
              >
                {isLocked ? "⚠️ Unstake (Locked)" : "Unstake"}
              </button>
            </div>
          </div>

          {stakedTokenIds.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {stakedTokenIds.map((id) => (
                <NFTCard
                  key={id.toString()}
                  tokenId={id}
                  collectionName={collectionName}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {userAddress
                  ? "You have no NFTs staked in this pool"
                  : "Connect your wallet to see staked NFTs"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Rewards Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-bold text-white mb-6">Rewards</h2>

          <div className="space-y-6">
            <div>
              <p className="text-gray-500 text-sm">Your Staked NFTs</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stakedCount?.toString() || "0"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Pending Rewards</p>
              <p className="text-2xl font-bold gradient-text mt-1">
                {earnedAmount
                  ? Number(formatEther(earnedAmount)).toFixed(4)
                  : "0.0000"}
                <span className="text-sm text-gray-500 ml-2">
                  {rewardSymbol || "tokens"}
                </span>
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Remaining Pool Rewards</p>
              <p className="text-lg font-medium text-white mt-1">
                {remainingRewards
                  ? Number(formatEther(remainingRewards)).toLocaleString()
                  : "0"}{" "}
                <span className="text-gray-500 text-sm">
                  {rewardSymbol || ""}
                </span>
              </p>
            </div>

            <button
              onClick={handleClaim}
              disabled={
                !earnedAmount || earnedAmount === 0n || isClaiming || claimConfirming
              }
              className="btn-primary w-full"
            >
              {isClaiming || claimConfirming
                ? "Claiming..."
                : "Claim Rewards"}
            </button>
          </div>

          {/* Pool Info */}
          <div className="mt-8 pt-6 border-t border-dark-500/30 space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Pool Info
            </h3>
            <InfoLine label="Collection" value={collectionName || "..."} />
            <InfoLine label="Symbol" value={collectionSymbol || "..."} />
            <InfoLine label="Reward Token" value={rewardSymbol || "..."} />
            <InfoLine
              label="Lock Period"
              value={lockPeriodDays > 0 ? `${lockPeriodDays} days` : "None"}
            />
            <InfoLine
              label="Owner"
              value={
                poolOwner
                  ? `${poolOwner.slice(0, 6)}...${poolOwner.slice(-4)}`
                  : "..."
              }
            />
            <InfoLine
              label="Created"
              value={
                createdAt > 0
                  ? new Date(createdAt * 1000).toLocaleDateString()
                  : "..."
              }
            />
            <InfoLine
              label="NFT Contract"
              value={
                nftAddress
                  ? `${nftAddress.slice(0, 6)}...${nftAddress.slice(-4)}`
                  : "..."
              }
              mono
            />
            <InfoLine
              label="Reward Contract"
              value={
                rewardTokenAddress
                  ? `${rewardTokenAddress.slice(0, 6)}...${rewardTokenAddress.slice(-4)}`
                  : "..."
              }
              mono
            />
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <StakeModal
        isOpen={stakeModalOpen}
        onClose={() => setStakeModalOpen(false)}
        tokenIds={[]}
        collectionName={collectionName}
        onStake={handleStake}
        isLoading={isStaking || stakeConfirming}
        mode="stake"
      />
      <StakeModal
        isOpen={unstakeModalOpen}
        onClose={() => setUnstakeModalOpen(false)}
        tokenIds={stakedTokenIds}
        collectionName={collectionName}
        onStake={handleUnstake}
        isLoading={isUnstaking || unstakeConfirming}
        mode="unstake"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight = false,
}: {
  label: string;
  value: string;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p
        className={`text-2xl font-bold mt-2 ${highlight ? "gradient-text" : "text-white"}`}
      >
        {value}
      </p>
      {suffix && <p className="text-gray-500 text-sm mt-1">{suffix}</p>}
    </motion.div>
  );
}

function InfoLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`text-white text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
