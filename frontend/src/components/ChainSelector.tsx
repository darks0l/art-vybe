import { motion } from "framer-motion";
import { chainList, type ChainConfig } from "../config/chains";

interface ChainSelectorProps {
  selected?: number;
  onSelect: (chainId: number) => void;
  compact?: boolean;
}

export default function ChainSelector({
  selected,
  onSelect,
  compact = false,
}: ChainSelectorProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {chainList.map((chain) => (
          <button
            key={chain.chain.id}
            onClick={() => onSelect(chain.chain.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selected === chain.chain.id
                ? "bg-purple/20 text-purple border border-purple/30"
                : "bg-dark-700 text-gray-400 border border-dark-500/50 hover:border-purple/20 hover:text-white"
            }`}
          >
            <ChainIcon chain={chain} size={16} />
            {chain.shortName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {chainList.map((chain, idx) => (
        <motion.button
          key={chain.chain.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(chain.chain.id)}
          className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
            selected === chain.chain.id
              ? "bg-purple/10 border-purple/40 shadow-lg shadow-purple/10"
              : "bg-dark-700/50 border-dark-500/50 hover:border-purple/20 hover:bg-dark-700"
          }`}
        >
          <ChainIcon chain={chain} size={32} />
          <span
            className={`text-sm font-medium ${
              selected === chain.chain.id ? "text-purple" : "text-gray-300"
            }`}
          >
            {chain.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function ChainIcon({ chain, size = 24 }: { chain: ChainConfig; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: chain.color + "20",
        color: chain.color,
        fontSize: size * 0.4,
      }}
    >
      {chain.shortName.slice(0, 2)}
    </div>
  );
}
