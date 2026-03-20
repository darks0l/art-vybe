# Art Vybe — NFT Staking Platform

Multi-chain NFT staking platform where users create staking pools and stake ERC-721 NFTs to earn ERC-20 token rewards. Dynamic APR model — reward rate is fixed, individual earnings dilute as more NFTs are staked.

## Supported Chains (8)

| Chain | ID | Fee Token |
|-------|-----|-----------|
| Ethereum | 1 | USDC |
| BSC | 56 | USDC |
| Base | 8453 | USDC |
| Polygon | 137 | USDC |
| Avalanche | 43114 | USDC |
| Cronos | 25 | USDC |
| Roburna | 158 | Native (RBA) |
| VSC | 420042 | Native (VSC) |

## Smart Contracts

### Architecture

- **StakingFactory.sol** — Deploys staking pools via ERC-1167 minimal proxy (clone) pattern. Collects creation fees.
- **StakingPool.sol** — Implementation contract cloned for each pool. Handles staking, unstaking, reward distribution.
- **FeeCollector.sol** — Receives and holds creation fees (USDC or native tokens).

### Reward Model

- Creator deposits a fixed total reward amount at pool creation
- `rewardRate = totalRewards / 365 days` (constant emission per second)
- Each staker earns: `(theirNFTs / totalStakedNFTs) * rewardRate` per second
- More stakers = lower individual APR, total emission stays constant
- Rewards accrue per-second using an accumulator pattern (O(1) gas per claim)

### Setup

```bash
cd contracts
npm install
```

### Compile

```bash
npx hardhat compile
```

### Test

```bash
npx hardhat test
```

26 tests covering: pool creation, staking, unstaking, reward calculation, dynamic APR, pool expiry, fee collection, native fees, edge cases.

### Deploy

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your deployer private key and API keys

# Deploy to a specific chain
npx hardhat run scripts/deploy.js --network ethereum
npx hardhat run scripts/deploy.js --network bsc
npx hardhat run scripts/deploy.js --network base
# ... etc
```

## Frontend

### Tech Stack

- Vite + React + TypeScript
- wagmi v2 + viem for chain interactions
- RainbowKit for wallet connection
- TailwindCSS for styling
- Framer Motion for animations
- React Router for navigation

### Setup

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, stats, how-it-works, chain grid |
| `/pools` | Explore all active staking pools, filter by chain |
| `/pool/:address` | Pool detail — stake/unstake NFTs, claim rewards, view stats |
| `/create` | Step-by-step pool creation wizard |
| `/my-pools` | Dashboard for created pools and staking positions |

### Post-Deployment

After deploying contracts, update the contract addresses in `frontend/src/config/contracts.ts` for each chain.

## Project Structure

```
art-vybe/
├── contracts/
│   ├── contracts/
│   │   ├── StakingFactory.sol
│   │   ├── StakingPool.sol
│   │   ├── FeeCollector.sol
│   │   └── mocks/
│   ├── scripts/deploy.js
│   ├── test/StakingFactory.test.js
│   └── hardhat.config.js
├── frontend/
│   └── src/
│       ├── abi/           # Contract ABIs
│       ├── config/        # Chain + contract config
│       ├── hooks/         # wagmi hooks
│       ├── components/    # Reusable UI components
│       └── pages/         # Route pages
└── README.md
```
