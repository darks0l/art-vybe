// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title FeeCollector
/// @notice Collects and holds creation fees from the Art Vybe StakingFactory
/// @dev Supports both ERC-20 (USDC) and native token fees
contract FeeCollector is Ownable {
    using SafeERC20 for IERC20;

    /// @notice Total ERC-20 fees collected (by token address)
    mapping(address => uint256) public totalTokenFeesCollected;

    /// @notice Total native fees collected
    uint256 public totalNativeFeesCollected;

    event ERC20FeeReceived(address indexed token, uint256 amount);
    event NativeFeeReceived(uint256 amount);
    event ERC20Withdrawn(address indexed token, address indexed to, uint256 amount);
    event NativeWithdrawn(address indexed to, uint256 amount);

    constructor(address _owner) Ownable(_owner) {}

    /// @notice Receive native token fees
    receive() external payable {
        totalNativeFeesCollected += msg.value;
        emit NativeFeeReceived(msg.value);
    }

    /// @notice Called by the factory to deposit ERC-20 fees
    /// @param token The ERC-20 token address
    /// @param amount The amount of tokens to deposit
    function depositERC20Fee(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        totalTokenFeesCollected[token] += amount;
        emit ERC20FeeReceived(token, amount);
    }

    /// @notice Withdraw accumulated ERC-20 fees
    /// @param token The ERC-20 token to withdraw
    /// @param to The recipient address
    /// @param amount The amount to withdraw
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
        emit ERC20Withdrawn(token, to, amount);
    }

    /// @notice Withdraw accumulated native token fees
    /// @param to The recipient address
    /// @param amount The amount to withdraw
    function withdrawNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        emit NativeWithdrawn(to, amount);
    }
}
