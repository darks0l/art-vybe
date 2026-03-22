const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Art Vybe Staking Platform", function () {
  let owner, creator, staker1, staker2;
  let feeCollector, stakingPoolImpl, stakingFactory;
  let mockNFT, rewardToken, feeToken;

  const POOL_DURATION = 365 * 24 * 60 * 60; // 1 year in seconds
  const CREATION_FEE = ethers.parseUnits("50", 6); // 50 USDC (6 decimals)
  const TOTAL_REWARDS = ethers.parseEther("100000"); // 100k reward tokens
  const DEFAULT_LOCK_DAYS = 0; // No lock by default
  const POOL_NAME = "Test Staking Pool";
  const POOL_DESC = "A test pool for unit tests";
  const POOL_LOGO = "https://example.com/logo.png";

  beforeEach(async function () {
    [owner, creator, staker1, staker2] = await ethers.getSigners();

    // Deploy mock ERC-20 for fees (USDC-like, 6 decimals)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    feeToken = await MockERC20.deploy("USD Coin", "USDC", 6);

    // Deploy mock ERC-20 for rewards (18 decimals)
    rewardToken = await MockERC20.deploy("Reward Token", "RWD", 18);

    // Deploy mock ERC-721
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    mockNFT = await MockERC721.deploy("Art Collection", "ART");

    // Deploy FeeCollector
    const FeeCollector = await ethers.getContractFactory("FeeCollector");
    feeCollector = await FeeCollector.deploy(owner.address);

    // Deploy StakingPool implementation
    const StakingPool = await ethers.getContractFactory("StakingPool");
    stakingPoolImpl = await StakingPool.deploy();

    // Deploy StakingFactory
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    stakingFactory = await StakingFactory.deploy(
      await stakingPoolImpl.getAddress(),
      await feeCollector.getAddress(),
      await feeToken.getAddress(),
      CREATION_FEE
    );

    // Mint fee tokens to creator
    await feeToken.mint(creator.address, ethers.parseUnits("1000", 6));
    // Mint reward tokens to creator
    await rewardToken.mint(creator.address, TOTAL_REWARDS * 2n);
    // Mint NFTs to stakers
    for (let i = 1; i <= 10; i++) {
      await mockNFT.mint(staker1.address, i);
    }
    for (let i = 11; i <= 20; i++) {
      await mockNFT.mint(staker2.address, i);
    }
  });

  async function createPool(lockDays = DEFAULT_LOCK_DAYS, name = POOL_NAME, desc = POOL_DESC, logo = POOL_LOGO) {
    await feeToken
      .connect(creator)
      .approve(await stakingFactory.getAddress(), CREATION_FEE);
    await rewardToken
      .connect(creator)
      .approve(await stakingFactory.getAddress(), TOTAL_REWARDS);

    const tx = await stakingFactory
      .connect(creator)
      .createPool(
        await mockNFT.getAddress(),
        await rewardToken.getAddress(),
        TOTAL_REWARDS,
        lockDays,
        name,
        desc,
        logo
      );
    await tx.wait();

    const poolCount = await stakingFactory.totalPools();
    const poolAddr = await stakingFactory.allPools(Number(poolCount) - 1);
    const pool = await ethers.getContractAt("StakingPool", poolAddr);
    return pool;
  }

  // ─── FeeCollector Tests ────────────────────────────

  describe("FeeCollector", function () {
    it("should accept native token fees via receive()", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await feeCollector.getAddress(),
        value: amount,
      });
      expect(await feeCollector.totalNativeFeesCollected()).to.equal(amount);
    });

    it("should allow owner to withdraw native fees", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await feeCollector.getAddress(),
        value: amount,
      });

      const balBefore = await ethers.provider.getBalance(owner.address);
      await feeCollector.withdrawNative(owner.address, amount);
      const balAfter = await ethers.provider.getBalance(owner.address);
      expect(balAfter).to.be.gt(balBefore);
    });

    it("should allow owner to withdraw ERC-20 fees", async function () {
      const amount = ethers.parseUnits("100", 6);
      await feeToken.mint(owner.address, amount);
      await feeToken.approve(await feeCollector.getAddress(), amount);
      await feeCollector.depositERC20Fee(await feeToken.getAddress(), amount);

      await feeCollector.withdrawERC20(
        await feeToken.getAddress(),
        owner.address,
        amount
      );
      expect(await feeToken.balanceOf(owner.address)).to.equal(amount);
    });

    it("should revert withdrawal from non-owner", async function () {
      await expect(
        feeCollector
          .connect(staker1)
          .withdrawNative(staker1.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(feeCollector, "OwnableUnauthorizedAccount");
    });
  });

  // ─── StakingFactory Tests ──────────────────────────

  describe("StakingFactory", function () {
    it("should create a pool and register it", async function () {
      const pool = await createPool();
      expect(await stakingFactory.totalPools()).to.equal(1);
      expect(await stakingFactory.isPool(await pool.getAddress())).to.be.true;
    });

    it("should collect creation fee in USDC", async function () {
      await createPool();
      const feeCollectorAddr = await feeCollector.getAddress();
      expect(await feeToken.balanceOf(feeCollectorAddr)).to.equal(CREATION_FEE);
    });

    it("should emit PoolCreated event", async function () {
      await feeToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), CREATION_FEE);
      await rewardToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), TOTAL_REWARDS);

      await expect(
        stakingFactory
          .connect(creator)
          .createPool(
            await mockNFT.getAddress(),
            await rewardToken.getAddress(),
            TOTAL_REWARDS,
            0,
            POOL_NAME,
            POOL_DESC,
            POOL_LOGO
          )
      ).to.emit(stakingFactory, "PoolCreated");
    });

    it("should revert pool creation when paused", async function () {
      await stakingFactory.pause();

      await feeToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), CREATION_FEE);
      await rewardToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), TOTAL_REWARDS);

      await expect(
        stakingFactory
          .connect(creator)
          .createPool(
            await mockNFT.getAddress(),
            await rewardToken.getAddress(),
            TOTAL_REWARDS,
            0,
            POOL_NAME,
            POOL_DESC,
            POOL_LOGO
          )
      ).to.be.revertedWithCustomError(stakingFactory, "EnforcedPause");
    });

    it("should allow owner to update creation fee", async function () {
      const newFee = ethers.parseUnits("100", 6);
      await stakingFactory.setCreationFee(newFee);
      expect(await stakingFactory.creationFee()).to.equal(newFee);
    });

    it("should track pools by creator", async function () {
      await createPool();
      const pools = await stakingFactory.getPoolsByCreator(creator.address);
      expect(pools.length).to.equal(1);
    });

    it("should create pool with native fee when feeToken is zero", async function () {
      const nativeFee = ethers.parseEther("1");
      const StakingFactory = await ethers.getContractFactory("StakingFactory");
      const nativeFactory = await StakingFactory.deploy(
        await stakingPoolImpl.getAddress(),
        await feeCollector.getAddress(),
        ethers.ZeroAddress,
        nativeFee
      );

      await rewardToken
        .connect(creator)
        .approve(await nativeFactory.getAddress(), TOTAL_REWARDS);

      await nativeFactory
        .connect(creator)
        .createPool(
          await mockNFT.getAddress(),
          await rewardToken.getAddress(),
          TOTAL_REWARDS,
          0,
          POOL_NAME,
          POOL_DESC,
          POOL_LOGO,
          { value: nativeFee }
        );

      expect(await nativeFactory.totalPools()).to.equal(1);
    });

    it("should store pool metadata (name, description, logo)", async function () {
      const pool = await createPool(0, "My Cool Pool", "Best NFT staking ever", "https://example.com/cool.png");
      const info = await stakingFactory.getPoolInfo(await pool.getAddress());
      expect(info.name).to.equal("My Cool Pool");
      expect(info.description).to.equal("Best NFT staking ever");
      expect(info.logoUrl).to.equal("https://example.com/cool.png");
    });

    it("should allow empty description and logo", async function () {
      const pool = await createPool(0, "Minimal Pool", "", "");
      const info = await stakingFactory.getPoolInfo(await pool.getAddress());
      expect(info.name).to.equal("Minimal Pool");
      expect(info.description).to.equal("");
      expect(info.logoUrl).to.equal("");
    });

    it("should revert if name is empty", async function () {
      await feeToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), CREATION_FEE);
      await rewardToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), TOTAL_REWARDS);

      await expect(
        stakingFactory
          .connect(creator)
          .createPool(
            await mockNFT.getAddress(),
            await rewardToken.getAddress(),
            TOTAL_REWARDS,
            0,
            "",
            POOL_DESC,
            POOL_LOGO
          )
      ).to.be.revertedWith("Name: 1-100 chars");
    });

    it("should revert if lock period exceeds 365 days", async function () {
      await feeToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), CREATION_FEE);
      await rewardToken
        .connect(creator)
        .approve(await stakingFactory.getAddress(), TOTAL_REWARDS);

      await expect(
        stakingFactory
          .connect(creator)
          .createPool(
            await mockNFT.getAddress(),
            await rewardToken.getAddress(),
            TOTAL_REWARDS,
            366,
            POOL_NAME,
            POOL_DESC,
            POOL_LOGO
          )
      ).to.be.revertedWith("Lock period cannot exceed pool duration");
    });
  });

  // ─── StakingPool Tests ─────────────────────────────

  describe("StakingPool", function () {
    let pool;

    beforeEach(async function () {
      pool = await createPool(0); // No lock
    });

    it("should be initialized with correct parameters", async function () {
      expect(await pool.owner()).to.equal(creator.address);
      expect(await pool.totalRewards()).to.equal(TOTAL_REWARDS);
      expect(await pool.initialized()).to.be.true;
      expect(await pool.lockPeriod()).to.equal(0);
    });

    it("should not allow double initialization", async function () {
      await expect(
        pool.initialize(
          creator.address,
          await mockNFT.getAddress(),
          await rewardToken.getAddress(),
          TOTAL_REWARDS,
          0
        )
      ).to.be.revertedWith("Already initialized");
    });

    it("should allow staking NFTs", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1, 2, 3]);

      expect(await pool.totalStaked()).to.equal(3);
      expect(await pool.stakedBalance(staker1.address)).to.equal(3);
      const ids = await pool.getStakedTokenIds(staker1.address);
      expect(ids.length).to.equal(3);
    });

    it("should allow unstaking NFTs (no lock = no penalty)", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1, 2, 3]);
      await pool.connect(staker1).unstake([2]);

      expect(await pool.totalStaked()).to.equal(2);
      expect(await mockNFT.ownerOf(2)).to.equal(staker1.address);
    });

    it("should revert unstaking someone else's token", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1]);

      await expect(
        pool.connect(staker2).unstake([1])
      ).to.be.revertedWith("Not your token");
    });

    it("should accrue rewards over time", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1]);

      await time.increase(30 * 24 * 60 * 60);

      const earned = await pool.earned(staker1.address);
      expect(earned).to.be.gt(0);
    });

    it("should allow claiming rewards", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1]);

      await time.increase(30 * 24 * 60 * 60);

      await pool.connect(staker1).claimRewards();
      const balance = await rewardToken.balanceOf(staker1.address);
      expect(balance).to.be.gt(0);
    });

    it("should distribute rewards proportionally (dynamic APR)", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1]);

      await time.increase(30 * 24 * 60 * 60);

      await mockNFT.connect(staker2).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker2).stake([11]);

      await time.increase(30 * 24 * 60 * 60);

      const earned1 = await pool.earned(staker1.address);
      const earned2 = await pool.earned(staker2.address);

      // Staker1 should have more (staked for 60 days vs 30 days)
      expect(earned1).to.be.gt(earned2);
    });

    it("should return correct pool info from pool contract", async function () {
      const info = await pool.getPoolInfo();
      expect(info._nftCollection).to.equal(await mockNFT.getAddress());
      expect(info._rewardToken).to.equal(await rewardToken.getAddress());
      expect(info._totalRewards).to.equal(TOTAL_REWARDS);
      expect(info._owner).to.equal(creator.address);
      expect(info._lockPeriod).to.equal(0);
    });

    it("should return correct metadata from factory", async function () {
      const info = await stakingFactory.getPoolInfo(await pool.getAddress());
      expect(info.name).to.equal(POOL_NAME);
      expect(info.description).to.equal(POOL_DESC);
      expect(info.logoUrl).to.equal(POOL_LOGO);
      expect(info.lockPeriodDays).to.equal(0);
    });

    it("should return correct staker info", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1, 2]);

      const info = await pool.getStakerInfo(staker1.address);
      expect(info.stakedCount).to.equal(2);
      expect(info.tokenIds.length).to.equal(2);
      expect(info.isLocked).to.be.false; // no lock on this pool
    });

    it("should not allow staking after pool expiry", async function () {
      await time.increase(POOL_DURATION + 1);

      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await expect(
        pool.connect(staker1).stake([1])
      ).to.be.revertedWith("Pool expired");
    });

    it("should allow owner to withdraw remaining rewards after expiry", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await pool.getAddress(), true);
      await pool.connect(staker1).stake([1]);

      await time.increase(30 * 24 * 60 * 60);
      await pool.connect(staker1).claimRewards();

      await time.increase(POOL_DURATION);

      const remainingBefore = await rewardToken.balanceOf(await pool.getAddress());
      await pool.connect(creator).creatorWithdraw();
      const creatorBalance = await rewardToken.balanceOf(creator.address);

      expect(creatorBalance).to.be.gt(0);
    });

    it("should revert creatorWithdraw before expiry", async function () {
      await expect(
        pool.connect(creator).creatorWithdraw()
      ).to.be.revertedWith("Pool not expired");
    });

    it("should revert claim when no rewards", async function () {
      await expect(
        pool.connect(staker1).claimRewards()
      ).to.be.revertedWith("No rewards");
    });
  });

  // ─── Ownership Tests ───────────────────────────────

  describe("Ownership", function () {
    let pool;

    beforeEach(async function () {
      pool = await createPool(0);
    });

    it("should allow pool owner to transfer ownership", async function () {
      await pool.connect(creator).transferOwnership(staker1.address);
      expect(await pool.owner()).to.equal(staker1.address);
    });

    it("should emit OwnershipTransferred event", async function () {
      await expect(pool.connect(creator).transferOwnership(staker1.address))
        .to.emit(pool, "OwnershipTransferred")
        .withArgs(creator.address, staker1.address);
    });

    it("should revert transfer from non-owner", async function () {
      await expect(
        pool.connect(staker1).transferOwnership(staker2.address)
      ).to.be.revertedWith("Only owner");
    });

    it("should revert transfer to zero address", async function () {
      await expect(
        pool.connect(creator).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid new owner");
    });

    it("should allow new owner to withdraw after expiry", async function () {
      await pool.connect(creator).transferOwnership(staker1.address);

      await time.increase(POOL_DURATION + 1);

      await pool.connect(staker1).creatorWithdraw();
      const balance = await rewardToken.balanceOf(staker1.address);
      expect(balance).to.be.gt(0);
    });

    it("should allow factory owner to transfer factory ownership", async function () {
      await stakingFactory.transferOwnership(creator.address);
      expect(await stakingFactory.owner()).to.equal(creator.address);
    });

    it("should allow fee collector owner to transfer ownership", async function () {
      await feeCollector.transferOwnership(creator.address);
      expect(await feeCollector.owner()).to.equal(creator.address);
    });

    it("should allow pool owner to renounce ownership", async function () {
      await pool.connect(creator).renounceOwnership();
      expect(await pool.owner()).to.equal(ethers.ZeroAddress);
    });
  });

  // ─── Lock Period Tests ─────────────────────────────

  describe("Lock Period", function () {
    let lockedPool;
    const LOCK_DAYS = 30;

    beforeEach(async function () {
      lockedPool = await createPool(LOCK_DAYS);
    });

    it("should initialize with correct lock period", async function () {
      const expectedLockSeconds = LOCK_DAYS * 24 * 60 * 60;
      expect(await lockedPool.lockPeriod()).to.equal(expectedLockSeconds);
    });

    it("should show user as locked after staking", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      expect(await lockedPool.isUserLocked(staker1.address)).to.be.true;
    });

    it("should forfeit rewards on early withdrawal", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      // Accrue some rewards
      await time.increase(10 * 24 * 60 * 60); // 10 days (still locked)

      const pendingBefore = await lockedPool.earned(staker1.address);
      expect(pendingBefore).to.be.gt(0);

      // Early unstake — should forfeit rewards
      await expect(lockedPool.connect(staker1).unstake([1]))
        .to.emit(lockedPool, "RewardsForfeited")
        .to.emit(lockedPool, "Unstaked");

      // Pending rewards should now be 0
      expect(await lockedPool.earned(staker1.address)).to.equal(0);
      // No reward tokens received
      expect(await rewardToken.balanceOf(staker1.address)).to.equal(0);
    });

    it("should emit earlyWithdrawal=true on early unstake", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      await time.increase(5 * 24 * 60 * 60); // 5 days, still locked

      await expect(lockedPool.connect(staker1).unstake([1]))
        .to.emit(lockedPool, "Unstaked")
        .withArgs(staker1.address, [1], true); // earlyWithdrawal = true
    });

    it("should allow penalty-free unstake after lock expires", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      // Wait for lock to expire
      await time.increase(LOCK_DAYS * 24 * 60 * 60 + 1);

      expect(await lockedPool.isUserLocked(staker1.address)).to.be.false;

      const pendingBefore = await lockedPool.earned(staker1.address);
      expect(pendingBefore).to.be.gt(0);

      // Unstake after lock — no penalty, rewards preserved
      await expect(lockedPool.connect(staker1).unstake([1]))
        .to.emit(lockedPool, "Unstaked")
        .withArgs(staker1.address, [1], false); // earlyWithdrawal = false

      // Rewards should still be claimable (earned before unstake)
      // Note: after unstake with 0 balance, earned should still reflect accrued
    });

    it("should return lock status in staker info", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      const info = await lockedPool.getStakerInfo(staker1.address);
      expect(info.isLocked).to.be.true;
      expect(info.lockEndsAt).to.be.gt(0);
    });

    it("should return lock period in pool info", async function () {
      const info = await lockedPool.getPoolInfo();
      expect(info._lockPeriod).to.equal(LOCK_DAYS * 24 * 60 * 60);
    });

    it("should allow claiming rewards while locked (without unstaking)", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      await time.increase(10 * 24 * 60 * 60);

      // Should be able to claim while locked
      await lockedPool.connect(staker1).claimRewards();
      expect(await rewardToken.balanceOf(staker1.address)).to.be.gt(0);

      // Still locked, still staked
      expect(await lockedPool.isUserLocked(staker1.address)).to.be.true;
      expect(await lockedPool.stakedBalance(staker1.address)).to.equal(1);
    });

    it("should reset lock timer when staking additional NFTs", async function () {
      await mockNFT.connect(staker1).setApprovalForAll(await lockedPool.getAddress(), true);
      await lockedPool.connect(staker1).stake([1]);

      const firstStakeTime = await lockedPool.stakeTimestamp(staker1.address);

      // Wait 15 days
      await time.increase(15 * 24 * 60 * 60);

      // Stake more — lock timer resets
      await lockedPool.connect(staker1).stake([2]);

      const secondStakeTime = await lockedPool.stakeTimestamp(staker1.address);
      expect(secondStakeTime).to.be.gt(firstStakeTime);

      // Should be locked again (30 day timer reset)
      expect(await lockedPool.isUserLocked(staker1.address)).to.be.true;
    });
  });

  // ─── Native Fee Factory Tests ──────────────────────

  describe("Native Fee Factory", function () {
    it("should refund excess native fee", async function () {
      const nativeFee = ethers.parseEther("1");
      const StakingFactory = await ethers.getContractFactory("StakingFactory");
      const nativeFactory = await StakingFactory.deploy(
        await stakingPoolImpl.getAddress(),
        await feeCollector.getAddress(),
        ethers.ZeroAddress,
        nativeFee
      );

      await rewardToken
        .connect(creator)
        .approve(await nativeFactory.getAddress(), TOTAL_REWARDS);

      await nativeFactory
        .connect(creator)
        .createPool(
          await mockNFT.getAddress(),
          await rewardToken.getAddress(),
          TOTAL_REWARDS,
          0,
          POOL_NAME,
          POOL_DESC,
          POOL_LOGO,
          { value: ethers.parseEther("2") }
        );

      expect(
        await ethers.provider.getBalance(await feeCollector.getAddress())
      ).to.equal(nativeFee);
    });
  });

  describe("Creator Withdraw Protection", function () {
    let poolContract;

    beforeEach(async function () {
      // Mint NFTs to staker1 (use high IDs to avoid collision with global beforeEach)
      await mockNFT.mint(staker1.address, 100);
      await mockNFT.mint(staker1.address, 101);

      // Setup: creator creates a pool
      await feeToken.mint(creator.address, CREATION_FEE);
      await feeToken.connect(creator).approve(await stakingFactory.getAddress(), CREATION_FEE);
      await rewardToken.mint(creator.address, TOTAL_REWARDS);
      await rewardToken.connect(creator).approve(await stakingFactory.getAddress(), TOTAL_REWARDS);

      const tx = await stakingFactory.connect(creator).createPool(
        await mockNFT.getAddress(),
        await rewardToken.getAddress(),
        TOTAL_REWARDS,
        DEFAULT_LOCK_DAYS,
        POOL_NAME, POOL_DESC, POOL_LOGO
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "PoolCreated");
      const poolAddress = event.args.pool;
      poolContract = await ethers.getContractAt("StakingPool", poolAddress);

      // Staker1 stakes 2 NFTs
      await mockNFT.connect(staker1).setApprovalForAll(poolAddress, true);
      await poolContract.connect(staker1).stake([100, 101]);
    });

    it("should NOT allow creator to drain unclaimed staker rewards", async function () {
      // Advance 180 days — staker has earned ~half the rewards
      await time.increase(180 * 24 * 60 * 60);

      // Pool expires
      await time.increase(186 * 24 * 60 * 60);

      // Staker has NOT claimed yet — rewards sitting in contract
      const pendingRewards = await poolContract.earned(staker1.address);
      expect(pendingRewards).to.be.gt(0);

      // Creator withdraws — should only get the surplus, not staker funds
      const balanceBefore = await rewardToken.balanceOf(creator.address);
      await poolContract.connect(creator).creatorWithdraw();
      const balanceAfter = await rewardToken.balanceOf(creator.address);
      const withdrawn = balanceAfter - balanceBefore;

      // Staker should still be able to claim their full rewards
      const stakerBefore = await rewardToken.balanceOf(staker1.address);
      await poolContract.connect(staker1).claimRewards();
      const stakerAfter = await rewardToken.balanceOf(staker1.address);
      const claimed = stakerAfter - stakerBefore;

      expect(claimed).to.be.gt(0);
      // Total withdrawn + claimed should not exceed total rewards
      expect(withdrawn + claimed).to.be.lte(TOTAL_REWARDS);
    });

    it("should only allow creator to withdraw dust when all rewards are earned", async function () {
      // Advance full year — all rewards earned by staker
      await time.increase(POOL_DURATION + 1);

      // Creator can only withdraw rounding dust (integer division remainder), not staker funds
      const balanceBefore = await rewardToken.balanceOf(creator.address);
      await poolContract.connect(creator).creatorWithdraw();
      const balanceAfter = await rewardToken.balanceOf(creator.address);
      const withdrawn = balanceAfter - balanceBefore;

      // Withdrawn amount should be negligible dust (< 1 token from rounding)
      expect(withdrawn).to.be.lt(ethers.parseEther("1"));

      // Staker should still claim their full rewards
      await poolContract.connect(staker1).claimRewards();
      const stakerBalance = await rewardToken.balanceOf(staker1.address);
      // Staker gets ~100k tokens (minus rounding dust)
      expect(stakerBalance).to.be.gt(ethers.parseEther("99999"));
    });
  });
});
