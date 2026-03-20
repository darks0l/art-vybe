import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import PoolCard from "../components/PoolCard";
import ChainSelector from "../components/ChainSelector";
import { usePoolsByCreator } from "../hooks/useStakingFactory";

type Tab = "created" | "staking";

export default function MyPools() {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const [tab, setTab] = useState<Tab>("staking");
  const [selectedChain, setSelectedChain] = useState<number>(walletChainId || 1);

  const { pools: createdPools } = usePoolsByCreator(
    selectedChain,
    address as `0x${string}` | undefined
  );

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 text-center max-w-lg mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-dark-600 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500">
            Connect your wallet to view your pools and staking activity
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white">My Pools</h1>
        <p className="text-gray-400 mt-2">
          Manage your created pools and staking positions
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-dark-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("staking")}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "staking"
              ? "bg-purple text-dark-900"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Staking In
        </button>
        <button
          onClick={() => setTab("created")}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "created"
              ? "bg-purple text-dark-900"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Created
        </button>
      </div>

      {/* Chain Filter */}
      <div className="mb-8">
        <ChainSelector
          selected={selectedChain}
          onSelect={setSelectedChain}
          compact
        />
      </div>

      {/* Content */}
      {tab === "created" && (
        <>
          {createdPools && createdPools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdPools.map((addr, idx) => (
                <PoolCard
                  key={addr}
                  address={addr}
                  chainId={selectedChain}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Created Pools"
              description="You haven't created any staking pools on this chain yet."
            />
          )}
        </>
      )}

      {tab === "staking" && (
        <EmptyState
          title="No Staking Positions"
          description="You're not staking in any pools on this chain. Browse pools to get started."
        />
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-16 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-dark-600 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </motion.div>
  );
}
