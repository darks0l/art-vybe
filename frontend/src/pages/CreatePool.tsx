import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import CreatePoolWizard from "../components/CreatePoolWizard";

export default function CreatePool() {
  const { isConnected } = useAccount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Create Staking Pool
        </h1>
        <p className="text-gray-400 mt-2 max-w-lg mx-auto">
          Set up a new NFT staking pool. Choose a collection, deposit rewards,
          and let your community start earning.
        </p>
      </motion.div>

      {isConnected ? (
        <CreatePoolWizard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500">
            Please connect your wallet to create a staking pool
          </p>
        </motion.div>
      )}
    </div>
  );
}
