import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-dark-500/50 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-dark to-purple flex items-center justify-center">
                <span className="text-dark-900 font-bold text-sm">AV</span>
              </div>
              <span className="text-xl font-bold gradient-text">Art Vybe</span>
            </div>
            <p className="text-gray-500 text-sm max-w-md">
              The premier multi-chain NFT staking platform. Stake your art, earn
              rewards. Create pools, build communities.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/pools" className="text-sm text-gray-500 hover:text-purple transition-colors">
                  Explore Pools
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-sm text-gray-500 hover:text-purple transition-colors">
                  Create Pool
                </Link>
              </li>
              <li>
                <Link to="/my-pools" className="text-sm text-gray-500 hover:text-purple transition-colors">
                  My Pools
                </Link>
              </li>
            </ul>
          </div>

          {/* Chains */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              Supported Chains
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Ethereum</li>
              <li>BSC</li>
              <li>Base</li>
              <li>Polygon</li>
              <li>Avalanche</li>
              <li>Cronos</li>
              <li>Roburna</li>
              <li>VSC</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-500/30 text-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Art Vybe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
