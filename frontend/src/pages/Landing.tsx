import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { chainList } from "../config/chains";

const stats = [
  { label: "Supported Chains", value: "8" },
  { label: "Pool Duration", value: "365 Days" },
  { label: "Exit Fee", value: "0%" },
];

export default function Landing() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-radial from-purple/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple/3 rounded-full blur-[200px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <img src="/assets/logo-horizontal.jpg" alt="ArtVybe" className="mx-auto mb-8 h-16 sm:h-20 object-contain" />
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
              <span className="text-white">Stake Your Art.</span>
              <br />
              <span className="gradient-text">Earn Rewards.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              The premier multi-chain NFT staking platform. Create pools for any
              ERC-721 collection, deposit reward tokens, and let your community
              earn by staking their NFTs.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create" className="btn-primary text-lg px-8 py-4">
                Create Pool
              </Link>
              <Link to="/pools" className="btn-secondary text-lg px-8 py-4">
                Explore Pools
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-dark-500/50 bg-dark-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-bold gradient-text">
                  {stat.value}
                </p>
                <p className="text-gray-500 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            How It Works
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Simple, transparent NFT staking in three steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Create a Pool",
              desc: "Choose a chain, select your NFT collection, deposit reward tokens. Pay a small USDC fee and your pool goes live.",
            },
            {
              step: "02",
              title: "Stake NFTs",
              desc: "Browse active pools and stake your NFTs. Rewards accrue per-second based on how many NFTs you've staked.",
            },
            {
              step: "03",
              title: "Earn Rewards",
              desc: "Claim your ERC-20 rewards at any time. Unstake with zero penalty. Dynamic APR adjusts as more stakers join.",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-purple font-bold text-xl">{item.step}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Chains */}
      <section className="bg-dark-800/30 border-y border-dark-500/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Multi-Chain Support
            </h2>
            <p className="mt-4 text-gray-400">
              Deploy staking pools on 8 different blockchains
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {chainList.map((chain, idx) => (
              <motion.div
                key={chain.chain.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-6 text-center hover:border-purple/20 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: chain.color + "20",
                    color: chain.color,
                  }}
                >
                  {chain.shortName.slice(0, 3)}
                </div>
                <p className="text-white font-medium">{chain.name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {chain.isNativeFee ? "Native Fee" : "USDC Fee"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple/5 to-transparent" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Start Staking?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Create your first staking pool or explore existing ones to start
              earning rewards today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create" className="btn-primary px-8 py-4">
                Create a Pool
              </Link>
              <Link to="/pools" className="btn-secondary px-8 py-4">
                Browse Pools
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
