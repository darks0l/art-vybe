// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./StakingPool.sol";
import "./FeeCollector.sol";

/// @title StakingFactory
/// @notice Deploys and registers Art Vybe NFT staking pools using the ERC-1167 minimal proxy pattern
/// @dev Pool creators pay a fee (USDC or native token on chains without USDC) to create pools
contract StakingFactory is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    /// @notice The StakingPool implementation that clones are based on
    address public immutable poolImplementation;

    /// @notice FeeCollector contract that receives creation fees
    FeeCollector public feeCollector;

    /// @notice Creation fee amount (in fee token decimals, e.g. 50e6 for 50 USDC)
    uint256 public creationFee;

    /// @notice Fee token address (address(0) means native token)
    address public feeToken;

    /// @notice All deployed pool addresses
    address[] public allPools;

    /// @notice Pools created by a specific address
    mapping(address => address[]) public poolsByCreator;

    /// @notice Whether an address is a pool deployed by this factory
    mapping(address => bool) public isPool;

    // ──────────────────────────────────────────────
    //  Structs
    // ──────────────────────────────────────────────

    struct PoolInfo {
        address pool;
        address creator;
        address nftCollection;
        address rewardToken;
        uint256 totalRewards;
        uint256 lockPeriodDays;
        uint256 createdAt;
        string name;
        string description;
        string logoUrl;
    }

    /// @notice Metadata for each pool
    mapping(address => PoolInfo) public poolInfo;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event PoolCreated(
        address indexed pool,
        address indexed creator,
        address indexed nftCollection,
        address rewardToken,
        uint256 totalRewards,
        uint256 lockPeriodDays
    );
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeTokenUpdated(address oldToken, address newToken);

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    /// @param _poolImplementation The StakingPool implementation address
    /// @param _feeCollector       The FeeCollector address
    /// @param _feeToken           Fee token (address(0) for native)
    /// @param _creationFee        Fee amount in token decimals
    constructor(
        address _poolImplementation,
        address _feeCollector,
        address _feeToken,
        uint256 _creationFee
    ) Ownable(msg.sender) {
        require(_poolImplementation != address(0), "Invalid implementation");
        require(_feeCollector != address(0), "Invalid fee collector");

        poolImplementation = _poolImplementation;
        feeCollector = FeeCollector(payable(_feeCollector));
        feeToken = _feeToken;
        creationFee = _creationFee;
    }

    // ──────────────────────────────────────────────
    //  Pool Creation
    // ──────────────────────────────────────────────

    /// @notice Create a new NFT staking pool
    /// @param nftCollection  ERC-721 collection address
    /// @param rewardToken    ERC-20 reward token address
    /// @param totalRewards   Total reward tokens to distribute over 1 year
    /// @param lockPeriodDays Lock period in days (0 = no lock). Early unstake forfeits rewards.
    /// @param _name          Pool display name (e.g. "Bored Ape Staking")
    /// @param _description   Pool description (project info, rules, etc.)
    /// @param _logoUrl       Optional logo/image URL for the pool
    /// @return pool          The address of the newly deployed pool
    function createPool(
        address nftCollection,
        address rewardToken,
        uint256 totalRewards,
        uint256 lockPeriodDays,
        string calldata _name,
        string calldata _description,
        string calldata _logoUrl
    ) external payable nonReentrant whenNotPaused returns (address pool) {
        require(nftCollection != address(0), "Invalid NFT address");
        require(rewardToken != address(0), "Invalid reward token");
        require(totalRewards > 0, "Rewards must be > 0");
        require(lockPeriodDays <= 365, "Lock period cannot exceed pool duration");
        require(bytes(_name).length > 0 && bytes(_name).length <= 100, "Name: 1-100 chars");
        require(bytes(_description).length <= 500, "Description: max 500 chars");
        require(bytes(_logoUrl).length <= 256, "Logo URL: max 256 chars");

        // --- Collect creation fee ---
        _collectFee();

        // --- Deploy clone ---
        pool = Clones.clone(poolImplementation);

        // --- Transfer reward tokens from creator to the pool ---
        IERC20(rewardToken).safeTransferFrom(msg.sender, pool, totalRewards);

        // --- Initialize the pool ---
        StakingPool(pool).initialize(
            msg.sender,
            nftCollection,
            rewardToken,
            totalRewards,
            lockPeriodDays
        );

        // --- Register ---
        allPools.push(pool);
        poolsByCreator[msg.sender].push(pool);
        isPool[pool] = true;
        poolInfo[pool] = PoolInfo({
            pool: pool,
            creator: msg.sender,
            nftCollection: nftCollection,
            rewardToken: rewardToken,
            totalRewards: totalRewards,
            lockPeriodDays: lockPeriodDays,
            createdAt: block.timestamp,
            name: _name,
            description: _description,
            logoUrl: _logoUrl
        });

        emit PoolCreated(pool, msg.sender, nftCollection, rewardToken, totalRewards, lockPeriodDays);
    }

    // ──────────────────────────────────────────────
    //  Views
    // ──────────────────────────────────────────────

    /// @notice Returns total number of pools created
    function totalPools() external view returns (uint256) {
        return allPools.length;
    }

    /// @notice Returns all pool addresses
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /// @notice Returns pools created by a specific address
    /// @param _creator The creator address
    function getPoolsByCreator(address _creator) external view returns (address[] memory) {
        return poolsByCreator[_creator];
    }

    /// @notice Returns pool info for a given pool address
    /// @param pool The pool address
    function getPoolInfo(address pool)
        external
        view
        returns (PoolInfo memory)
    {
        require(isPool[pool], "Not a pool");
        return poolInfo[pool];
    }

    // ──────────────────────────────────────────────
    //  Admin
    // ──────────────────────────────────────────────

    /// @notice Update the creation fee
    /// @param _newFee The new fee amount
    function setCreationFee(uint256 _newFee) external onlyOwner {
        emit CreationFeeUpdated(creationFee, _newFee);
        creationFee = _newFee;
    }

    /// @notice Update the fee token (address(0) for native)
    /// @param _newToken The new fee token address
    function setFeeToken(address _newToken) external onlyOwner {
        emit FeeTokenUpdated(feeToken, _newToken);
        feeToken = _newToken;
    }

    /// @notice Pause the factory (disables new pool creation)
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the factory
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Pause a specific pool (emergency)
    /// @param pool The pool address to pause
    function pausePool(address pool) external onlyOwner {
        require(isPool[pool], "Not a pool");
        StakingPool(pool).pause();
    }

    /// @notice Unpause a specific pool
    /// @param pool The pool address to unpause
    function unpausePool(address pool) external onlyOwner {
        require(isPool[pool], "Not a pool");
        StakingPool(pool).unpause();
    }

    // ──────────────────────────────────────────────
    //  Internal
    // ──────────────────────────────────────────────

    /// @dev Collect creation fee (ERC-20 or native)
    function _collectFee() internal {
        if (creationFee == 0) return;

        if (feeToken == address(0)) {
            // Native token fee
            require(msg.value >= creationFee, "Insufficient native fee");
            (bool success, ) = address(feeCollector).call{value: creationFee}("");
            require(success, "Fee transfer failed");
            // Refund excess
            if (msg.value > creationFee) {
                (bool refund, ) = msg.sender.call{value: msg.value - creationFee}("");
                require(refund, "Refund failed");
            }
        } else {
            // ERC-20 fee — transfer from caller to fee collector
            IERC20(feeToken).safeTransferFrom(msg.sender, address(feeCollector), creationFee);
            // Also update the fee collector's internal tracking
        }
    }
}
