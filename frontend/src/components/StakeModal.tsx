import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NFTCard from "./NFTCard";

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenIds: bigint[];
  collectionName?: string;
  onStake: (selectedIds: bigint[]) => void;
  isLoading?: boolean;
  mode: "stake" | "unstake";
}

export default function StakeModal({
  isOpen,
  onClose,
  tokenIds,
  collectionName,
  onStake,
  isLoading = false,
  mode,
}: StakeModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: bigint) => {
    const key = id.toString();
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleConfirm = () => {
    const ids = Array.from(selected).map((s) => BigInt(s));
    onStake(ids);
  };

  const selectAll = () => {
    if (selected.size === tokenIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tokenIds.map((id) => id.toString())));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-dark-500/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === "stake" ? "Stake NFTs" : "Unstake NFTs"}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Select the NFTs you want to {mode}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* NFT Grid */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {tokenIds.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No NFTs available to {mode}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-400">
                      {selected.size} of {tokenIds.length} selected
                    </p>
                    <button
                      onClick={selectAll}
                      className="text-sm text-purple hover:text-purple-light transition-colors"
                    >
                      {selected.size === tokenIds.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {tokenIds.map((id) => (
                      <NFTCard
                        key={id.toString()}
                        tokenId={id}
                        collectionName={collectionName}
                        selected={selected.has(id.toString())}
                        onClick={() => toggleSelect(id)}
                        showSelect
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-dark-500/50 flex items-center justify-end gap-3">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selected.size === 0 || isLoading}
                className="btn-primary"
              >
                {isLoading
                  ? "Processing..."
                  : `${mode === "stake" ? "Stake" : "Unstake"} ${selected.size} NFT${selected.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
