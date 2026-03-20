// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title StakingPool
/// @notice An NFT staking pool where stakers earn ERC-20 token rewards
/// @dev Deployed as a minimal proxy (ERC-1167 clone) by StakingFactory.
///      Uses initialize() instead of a constructor.
///
///      **Reward model (dynamic APR):**
///        - The creator deposits a fixed `totalRewards` at pool creation.
///        - `rewardRate = totalRewards / POOL_DURATION` tokens per second.
///        - Each staker earns proportional to `(theirNFTs / totalStakedNFTs)` per second.
///        - As more NFTs enter the pool the individual rate dilutes, but total
///          emission stays constant.
///
///      **Lock period:**
///        - Pool creator sets a lock period (in days) at creation. Can be 0 for no lock.
///        - Each staker's lock starts from when THEY stake.
///        - Early withdrawal (before lock expires) forfeits all pending rewards.
///        - After lock period: free exit, full rewards.
///
///      Rewards are tracked with an accumulator pattern (`rewardPerTokenStored`)
///      so gas cost is O(1) per claim regardless of pool size.
contract StakingPool is IERC721Receiver, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    //  Constants
    // ──────────────────────────────────────────────

    /// @notice Pool lifetime: 365 days
    uint256 public constant POOL_DURATION = 365 days;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    bool public initialized;

    address public factory;
    address public owner;
    IERC721 public nftCollection;
    IERC20 public rewardToken;

    uint256 public totalRewards;
    uint256 public rewardRate; // tokens per second (scaled)
    uint256 public startTime;
    uint256 public endTime;

    /// @notice Lock period in seconds (0 = no lock)
    uint256 public lockPeriod;

    uint256 public totalStaked;

    // Accumulator pattern
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;

    // Per-user bookkeeping
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards; // accrued, unclaimed
    mapping(address => uint256) public stakedBalance; // NFT count
    mapping(address => uint256[]) internal _stakedTokenIds;
    mapping(uint256 => address) public tokenOwner; // tokenId -> staker

    /// @notice Timestamp when each user last staked (lock timer resets on new stake)
    mapping(address => uint256) public stakeTimestamp;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event PoolInitialized(
        address indexed creator,
        address indexed nftCollection,
        address indexed rewardToken,
        uint256 totalRewards,
        uint256 lockPeriodDays
    );
    event Staked(address indexed user, uint256[] tokenIds);
    event Unstaked(address indexed user, uint256[] tokenIds, bool earlyWithdrawal);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsForfeited(address indexed user, uint256 amount);
    event CreatorWithdraw(address indexed creator, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier onlyPoolOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // ──────────────────────────────────────────────
    //  Initialization
    // ──────────────────────────────────────────────

    /// @notice Initializes the pool (called once by the factory)
    /// @param _creator        Pool creator (becomes initial owner)
    /// @param _nft            ERC-721 collection address
    /// @param _rewardToken    ERC-20 reward token address
    /// @param _totalRewards   Total reward tokens to distribute over the pool lifetime
    /// @param _lockPeriodDays Lock period in days (0 = no lock). Early unstake forfeits rewards.
    function initialize(
        address _creator,
        address _nft,
        address _rewardToken,
        uint256 _totalRewards,
        uint256 _lockPeriodDays
    ) external {
        require(!initialized, "Already initialized");
        initialized = true;

        factory = msg.sender;
        owner = _creator;
        nftCollection = IERC721(_nft);
        rewardToken = IERC20(_rewardToken);
        totalRewards = _totalRewards;
        lockPeriod = _lockPeriodDays * 1 days;

        rewardRate = _totalRewards / POOL_DURATION;
        startTime = block.timestamp;
        endTime = block.timestamp + POOL_DURATION;
        lastUpdateTime = block.timestamp;

        emit PoolInitialized(_creator, _nft, _rewardToken, _totalRewards, _lockPeriodDays);
    }

    // ──────────────────────────────────────────────
    //  Ownership
    // ──────────────────────────────────────────────

    /// @notice Transfer pool ownership to a new address
    /// @param newOwner The address to transfer ownership to
    function transferOwnership(address newOwner) external onlyPoolOwner {
        require(newOwner != address(0), "Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Renounce pool ownership (irreversible)
    function renounceOwnership() external onlyPoolOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    // ──────────────────────────────────────────────
    //  Views
    // ──────────────────────────────────────────────

    /// @notice Returns the latest time at which rewards are applicable
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < endTime ? block.timestamp : endTime;
    }

    /// @notice Accumulated reward per staked NFT (scaled by 1e18)
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) /
            totalStaked;
    }

    /// @notice Returns the pending (unclaimed) rewards for an account
    /// @param account The staker address
    function earned(address account) public view returns (uint256) {
        return
            (stakedBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) /
            1e18 +
            rewards[account];
    }

    /// @notice Returns the current APR (basis points, where 10000 = 100%)
    /// @dev APR = (rewardRate * 365 days * 10000) / (totalStaked * rewardTokenPrice)
    ///      Since we don't have on-chain prices, we return a simplified version:
    ///      annualRewardsPerNFT / 1e18 (the caller must interpret based on token decimals)
    function getCurrentAPR() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        return (rewardRate * 365 days * 1e18) / totalStaked;
    }

    /// @notice Returns the token IDs staked by a user
    /// @param user The staker address
    function getStakedTokenIds(address user) external view returns (uint256[] memory) {
        return _stakedTokenIds[user];
    }

    /// @notice Returns staker info: staked count, pending rewards, token IDs, lock status
    /// @param user The staker address
    function getStakerInfo(address user)
        external
        view
        returns (
            uint256 stakedCount,
            uint256 pendingRewards,
            uint256[] memory tokenIds,
            bool isLocked,
            uint256 lockEndsAt
        )
    {
        stakedCount = stakedBalance[user];
        pendingRewards = earned(user);
        tokenIds = _stakedTokenIds[user];
        if (lockPeriod > 0 && stakeTimestamp[user] > 0) {
            lockEndsAt = stakeTimestamp[user] + lockPeriod;
            isLocked = block.timestamp < lockEndsAt;
        }
    }

    /// @notice Check if a user's stake is currently locked
    /// @param user The staker address
    function isUserLocked(address user) public view returns (bool) {
        if (lockPeriod == 0 || stakeTimestamp[user] == 0) return false;
        return block.timestamp < stakeTimestamp[user] + lockPeriod;
    }

    /// @notice Returns pool-level stats
    function getPoolInfo()
        external
        view
        returns (
            address _nftCollection,
            address _rewardToken,
            uint256 _totalRewards,
            uint256 _totalStaked,
            uint256 _rewardRate,
            uint256 _startTime,
            uint256 _endTime,
            uint256 _remainingRewards,
            address _owner,
            uint256 _lockPeriod
        )
    {
        _nftCollection = address(nftCollection);
        _rewardToken = address(rewardToken);
        _totalRewards = totalRewards;
        _totalStaked = totalStaked;
        _rewardRate = rewardRate;
        _startTime = startTime;
        _endTime = endTime;
        _remainingRewards = rewardToken.balanceOf(address(this));
        _owner = owner;
        _lockPeriod = lockPeriod;
    }

    /// @notice Whether the pool has expired
    function isExpired() public view returns (bool) {
        return block.timestamp >= endTime;
    }

    // ──────────────────────────────────────────────
    //  Staking
    // ──────────────────────────────────────────────

    /// @notice Stake one or more NFTs into the pool
    /// @dev Resets the user's lock timer on each new stake action
    /// @param tokenIds Array of token IDs to stake
    function stake(uint256[] calldata tokenIds)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        require(!isExpired(), "Pool expired");
        require(tokenIds.length > 0, "No tokens");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            nftCollection.safeTransferFrom(msg.sender, address(this), tokenId);
            tokenOwner[tokenId] = msg.sender;
            _stakedTokenIds[msg.sender].push(tokenId);
        }

        stakedBalance[msg.sender] += tokenIds.length;
        totalStaked += tokenIds.length;

        // Reset lock timer on every stake action
        stakeTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, tokenIds);
    }

    /// @notice Unstake one or more NFTs
    /// @dev If lock period is active and user unstakes early, all pending rewards are forfeited.
    ///      If no lock or lock has expired, unstake freely with full rewards.
    /// @param tokenIds Array of token IDs to unstake
    function unstake(uint256[] calldata tokenIds)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(tokenIds.length > 0, "No tokens");

        bool earlyWithdrawal = isUserLocked(msg.sender);

        // If early withdrawal, forfeit all pending rewards
        if (earlyWithdrawal) {
            uint256 forfeited = rewards[msg.sender];
            rewards[msg.sender] = 0;
            if (forfeited > 0) {
                emit RewardsForfeited(msg.sender, forfeited);
            }
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(tokenOwner[tokenId] == msg.sender, "Not your token");

            tokenOwner[tokenId] = address(0);
            _removeTokenId(msg.sender, tokenId);
            nftCollection.safeTransferFrom(address(this), msg.sender, tokenId);
        }

        stakedBalance[msg.sender] -= tokenIds.length;
        totalStaked -= tokenIds.length;

        // Clear stake timestamp if fully unstaked
        if (stakedBalance[msg.sender] == 0) {
            stakeTimestamp[msg.sender] = 0;
        }

        emit Unstaked(msg.sender, tokenIds, earlyWithdrawal);
    }

    /// @notice Claim accrued rewards
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards");

        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    // ──────────────────────────────────────────────
    //  Creator Functions
    // ──────────────────────────────────────────────

    /// @notice After pool expires, owner can withdraw remaining undistributed rewards
    function creatorWithdraw() external onlyPoolOwner nonReentrant {
        require(isExpired(), "Pool not expired");
        uint256 remaining = rewardToken.balanceOf(address(this));
        require(remaining > 0, "No remaining rewards");
        rewardToken.safeTransfer(owner, remaining);
        emit CreatorWithdraw(owner, remaining);
    }

    // ──────────────────────────────────────────────
    //  Admin (Factory)
    // ──────────────────────────────────────────────

    /// @notice Pause the pool (emergency)
    function pause() external onlyFactory {
        _pause();
    }

    /// @notice Unpause the pool
    function unpause() external onlyFactory {
        _unpause();
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    /// @dev Remove a tokenId from a user's staked list (swap-and-pop)
    function _removeTokenId(address user, uint256 tokenId) internal {
        uint256[] storage ids = _stakedTokenIds[user];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == tokenId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                return;
            }
        }
        revert("Token not found");
    }

    /// @notice ERC-721 receiver hook
    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }
}
