import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import ChainSelector from "../components/ChainSelector";
import PoolCard from "../components/PoolCard";
import { useStakingFactory } from "../hooks/useStakingFactory";
import { chainList } from "../config/chains";

export default function ExplorePools() {
  const { chainId: walletChainId } = useAccount();
  const [selectedChain, setSelectedChain] = useState<number>(walletChainId || 1);

  const { allPools, totalPools } = useStakingFactory(selectedChain);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Explore Pools
        </h1>
        <p className="text-gray-400 mt-2">
          Browse active staking pools across all supported chains
        </p>
      </motion.div>

      {/* Chain Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <ChainSelector
          selected={selectedChain}
          onSelect={setSelectedChain}
          compact
        />
      </motion.div>

      {/* Pool Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 text-sm">
          {totalPools !== undefined
            ? `${totalPools.toString()} pool${Number(totalPools) !== 1 ? "s" : ""} found`
            : "Loading..."}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Sort by:</span>
          <select className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple/50">
            <option>Newest</option>
            <option>Highest APR</option>
            <option>Most Staked</option>
          </select>
        </div>
      </div>

      {/* Pool Grid */}
      {allPools && allPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPools.map((addr, idx) => (
            <PoolCard
              key={addr}
              address={addr}
              chainId={selectedChain}
              index={idx}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-16 text-center"
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Pools Found
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            No staking pools have been created on{" "}
            {chainList.find((c) => c.chain.id === selectedChain)?.name || "this chain"}{" "}
            yet. Be the first to create one!
          </p>
        </motion.div>
      )}
    </div>
  );
}
