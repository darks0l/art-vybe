import { motion } from "framer-motion";

interface NFTCardProps {
  tokenId: bigint | number;
  collectionName?: string;
  selected?: boolean;
  onClick?: () => void;
  showSelect?: boolean;
}

export default function NFTCard({
  tokenId,
  collectionName,
  selected = false,
  onClick,
  showSelect = false,
}: NFTCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        selected
          ? "border-purple shadow-lg shadow-purple/20"
          : "border-dark-500/50 hover:border-dark-500"
      }`}
    >
      {/* Placeholder image */}
      <div className="aspect-square bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold gradient-text">#{tokenId.toString()}</p>
          <p className="text-gray-500 text-xs mt-1">
            {collectionName || "NFT"}
          </p>
        </div>
      </div>

      {/* Bottom info */}
      <div className="p-3 bg-dark-800">
        <p className="text-sm font-medium text-white">
          Token #{tokenId.toString()}
        </p>
      </div>

      {/* Selection indicator */}
      {showSelect && (
        <div
          className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            selected
              ? "bg-purple border-purple"
              : "border-gray-500 bg-dark-800/80"
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
    </motion.div>
  );
}
