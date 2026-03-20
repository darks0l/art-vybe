import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEther, parseUnits } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import ChainSelector from "./ChainSelector";
import { getChainConfig } from "../config/chains";
import {
  StakingFactoryABI,
  ERC20_ABI,
  getContractAddresses,
} from "../config/contracts";

const steps = [
  "Select Chain",
  "Pool Details",
  "NFT Collection",
  "Reward Token",
  "Review & Create",
];

export default function CreatePoolWizard() {
  const { address, chainId: walletChainId } = useAccount();
  const [step, setStep] = useState(0);

  // Form state
  const [selectedChain, setSelectedChain] = useState<number | undefined>();
  const [poolName, setPoolName] = useState("");
  const [poolDescription, setPoolDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [lockPeriodDays, setLockPeriodDays] = useState(0);
  const [nftAddress, setNftAddress] = useState("");
  const [rewardTokenAddress, setRewardTokenAddress] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardDecimals, setRewardDecimals] = useState(18);

  // TX state for fee approval
  const {
    data: feeApproveHash,
    writeContract: approveFee,
    isPending: approvingFee,
  } = useWriteContract();
  const { isLoading: feeApproveConfirming, isSuccess: feeApproved } =
    useWaitForTransactionReceipt({ hash: feeApproveHash });

  // TX state for reward approval
  const {
    data: rewardApproveHash,
    writeContract: approveReward,
    isPending: approvingReward,
  } = useWriteContract();
  const { isLoading: rewardApproveConfirming, isSuccess: rewardApproved } =
    useWaitForTransactionReceipt({ hash: rewardApproveHash });

  // TX state for pool creation
  const {
    data: createHash,
    writeContract: createPoolWrite,
    isPending: creating,
  } = useWriteContract();
  const { isLoading: createConfirming, isSuccess: createConfirmed } =
    useWaitForTransactionReceipt({ hash: createHash });

  const chainConfig = selectedChain ? getChainConfig(selectedChain) : undefined;
  const contracts = selectedChain ? getContractAddresses(selectedChain) : undefined;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleApproveFee = () => {
    if (!contracts || !chainConfig) return;
    if (chainConfig.isNativeFee) {
      toast.success("Native fee — no approval needed");
      return;
    }
    approveFee({
      address: chainConfig.usdcAddress!,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contracts.stakingFactory, parseUnits("50", 6)],
    });
  };

  const handleApproveReward = () => {
    if (!contracts || !rewardTokenAddress || !rewardAmount) return;
    const amount = parseUnits(rewardAmount, rewardDecimals);
    approveReward({
      address: rewardTokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contracts.stakingFactory, amount],
    });
  };

  const handleCreate = () => {
    if (!contracts || !rewardTokenAddress || !rewardAmount) return;
    const amount = parseUnits(rewardAmount, rewardDecimals);
    const value = chainConfig?.isNativeFee ? parseEther("50") : 0n;

    createPoolWrite({
      address: contracts.stakingFactory,
      abi: StakingFactoryABI,
      functionName: "createPool",
      args: [
        nftAddress as `0x${string}`,
        rewardTokenAddress as `0x${string}`,
        amount,
        BigInt(lockPeriodDays),
        poolName,
        poolDescription,
        logoUrl,
      ],
      value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((label, idx) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  idx <= step
                    ? "bg-purple text-dark-900"
                    : "bg-dark-600 text-gray-500"
                }`}
              >
                {idx < step ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  idx <= step ? "text-purple" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mt-[-1.25rem] ${
                  idx < step ? "bg-purple" : "bg-dark-600"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8"
        >
          {/* Step 0: Chain Selection */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Select Blockchain
              </h2>
              <p className="text-gray-500 mb-6">
                Choose the chain where you want to create your staking pool
              </p>
              <ChainSelector
                selected={selectedChain}
                onSelect={setSelectedChain}
              />
            </div>
          )}

          {/* Step 1: Pool Details (Name, Description, Logo, Lock Period) */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Pool Details
              </h2>
              <p className="text-gray-500 mb-6">
                Give your pool an identity — this is what stakers will see
              </p>
              <div className="space-y-5">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Pool Name <span className="text-purple">*</span>
                  </label>
                  <input
                    type="text"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value.slice(0, 100))}
                    placeholder="e.g. Art Vybe Genesis Staking"
                    className="input-field"
                    maxLength={100}
                  />
                  <p className="text-gray-600 text-xs mt-1">{poolName.length}/100</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Description
                  </label>
                  <textarea
                    value={poolDescription}
                    onChange={(e) => setPoolDescription(e.target.value.slice(0, 500))}
                    placeholder="Describe your staking pool — project info, earning potential, community details..."
                    className="input-field min-h-[100px] resize-y"
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-gray-600 text-xs mt-1">{poolDescription.length}/500</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Logo / Image URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value.slice(0, 256))}
                    placeholder="https://example.com/logo.png"
                    className="input-field"
                    maxLength={256}
                  />
                  {logoUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={logoUrl}
                        alt="Pool logo preview"
                        className="w-12 h-12 rounded-xl object-cover border border-dark-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="text-xs text-gray-500">Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Lock Period (Days)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={365}
                      value={lockPeriodDays}
                      onChange={(e) => setLockPeriodDays(Number(e.target.value))}
                      className="flex-1 accent-purple"
                    />
                    <div className="w-20">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={lockPeriodDays}
                        onChange={(e) => {
                          const v = Math.min(365, Math.max(0, Number(e.target.value) || 0));
                          setLockPeriodDays(v);
                        }}
                        className="input-field text-center text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mt-2">
                    {lockPeriodDays === 0 ? (
                      <span className="text-green-400">No lock — stakers can withdraw anytime</span>
                    ) : (
                      <span className="text-amber-400">
                        Early withdrawal forfeits pending rewards. Lock resets on additional stakes.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: NFT Collection */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                NFT Collection
              </h2>
              <p className="text-gray-500 mb-6">
                Enter the ERC-721 contract address for the collection
              </p>
              <input
                type="text"
                value={nftAddress}
                onChange={(e) => setNftAddress(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono"
              />
              {nftAddress && nftAddress.length === 42 && (
                <p className="text-green-400 text-sm mt-2">
                  ✓ Valid address format
                </p>
              )}
            </div>
          )}

          {/* Step 3: Reward Token */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Reward Token
              </h2>
              <p className="text-gray-500 mb-6">
                Set the ERC-20 reward token and total amount to distribute over 1 year
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Reward Token Address
                  </label>
                  <input
                    type="text"
                    value={rewardTokenAddress}
                    onChange={(e) => setRewardTokenAddress(e.target.value)}
                    placeholder="0x..."
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Token Decimals
                  </label>
                  <input
                    type="number"
                    value={rewardDecimals}
                    onChange={(e) =>
                      setRewardDecimals(Number(e.target.value) || 18)
                    }
                    className="input-field w-32"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Total Reward Amount
                  </label>
                  <input
                    type="text"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    placeholder="100000"
                    className="input-field"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    This full amount will be distributed over 1 year to all stakers
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Review & Create
              </h2>
              <p className="text-gray-500 mb-6">
                Review your pool settings and approve transactions
              </p>

              {/* Pool Preview Card */}
              <div className="border border-dark-500/50 rounded-2xl p-5 mb-6 bg-dark-800/50">
                <div className="flex items-start gap-4 mb-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={poolName}
                      className="w-14 h-14 rounded-xl object-cover border border-dark-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-dark-600 flex items-center justify-center">
                      <span className="text-2xl">🎨</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">{poolName || "Unnamed Pool"}</h3>
                    {poolDescription && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{poolDescription}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <InfoRow label="Chain" value={chainConfig?.name || "Unknown"} />
                <InfoRow
                  label="NFT Collection"
                  value={`${nftAddress.slice(0, 6)}...${nftAddress.slice(-4)}`}
                />
                <InfoRow
                  label="Reward Token"
                  value={`${rewardTokenAddress.slice(0, 6)}...${rewardTokenAddress.slice(-4)}`}
                />
                <InfoRow label="Total Rewards" value={`${rewardAmount} tokens`} />
                <InfoRow label="Duration" value="365 days" />
                <InfoRow
                  label="Lock Period"
                  value={lockPeriodDays === 0 ? "None (free exit)" : `${lockPeriodDays} days`}
                  highlight={lockPeriodDays > 0}
                />
                <InfoRow
                  label="Creation Fee"
                  value={
                    chainConfig?.isNativeFee
                      ? `50 ${chainConfig.chain.nativeCurrency.symbol}`
                      : "50 USDC"
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!chainConfig?.isNativeFee && (
                  <button
                    onClick={handleApproveFee}
                    disabled={approvingFee || feeApproveConfirming || feeApproved}
                    className={`w-full py-3 rounded-xl font-medium transition-all ${
                      feeApproved
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "btn-secondary"
                    }`}
                  >
                    {feeApproved
                      ? "✓ Fee Approved"
                      : approvingFee || feeApproveConfirming
                        ? "Approving Fee..."
                        : "1. Approve USDC Fee"}
                  </button>
                )}

                <button
                  onClick={handleApproveReward}
                  disabled={approvingReward || rewardApproveConfirming || rewardApproved}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    rewardApproved
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "btn-secondary"
                  }`}
                >
                  {rewardApproved
                    ? "✓ Rewards Approved"
                    : approvingReward || rewardApproveConfirming
                      ? "Approving Rewards..."
                      : `${chainConfig?.isNativeFee ? "1" : "2"}. Approve Reward Tokens`}
                </button>

                <button
                  onClick={handleCreate}
                  disabled={creating || createConfirming}
                  className="btn-primary w-full"
                >
                  {createConfirmed
                    ? "✓ Pool Created!"
                    : creating || createConfirming
                      ? "Creating Pool..."
                      : `${chainConfig?.isNativeFee ? "2" : "3"}. Create Pool`}
                </button>

                {createConfirmed && (
                  <p className="text-green-400 text-center text-sm mt-2">
                    🎉 Your staking pool has been created successfully!
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prev}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-30"
        >
          Back
        </button>
        {step < steps.length - 1 && (
          <button
            onClick={next}
            disabled={
              (step === 0 && !selectedChain) ||
              (step === 1 && !poolName.trim()) ||
              (step === 2 && nftAddress.length !== 42) ||
              (step === 3 && (!rewardTokenAddress || !rewardAmount))
            }
            className="btn-primary"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dark-500/30">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`font-medium text-sm ${highlight ? "text-amber-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
