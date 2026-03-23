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

    event NativeFeeReceived(address indexed from, uint256 amount, uint256 newBalance);
    event ERC20Withdrawn(address indexed token, address indexed to, uint256 amount, uint256 remainingBalance);
    event NativeWithdrawn(address indexed to, uint256 amount, uint256 remainingBalance);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);

    constructor(address _owner) Ownable(_owner) {}

    /// @notice Receive native token fees
    receive() external payable {
        emit NativeFeeReceived(msg.sender, msg.value, address(this).balance);
    }

    /// @notice Withdraw accumulated ERC-20 fees
    /// @param token The ERC-20 token to withdraw
    /// @param to The recipient address
    /// @param amount The amount to withdraw
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
        emit ERC20Withdrawn(token, to, amount, IERC20(token).balanceOf(address(this)));
    }

    /// @notice Withdraw accumulated native token fees
    /// @param to The recipient address
    /// @param amount The amount to withdraw
    function withdrawNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
        emit NativeWithdrawn(to, amount, address(this).balance);
    }

    /// @notice View current ERC-20 balance for a token
    /// @param token The ERC-20 token address
    function tokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice View current native balance
    function nativeBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
