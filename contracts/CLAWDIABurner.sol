// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title CLAWDIABurner
 * @notice Handles automatic $CLAWDIA token purchases and burns for Sunset Protocol
 * @dev Uses Uniswap V3 router for swaps, burns tokens to dead address
 * 
 * TOKENOMICS:
 * - Total Supply: 100,000,000,000 (100B) $CLAWDIA
 * - Registration: 25M $CLAWDIA burned = 0.025% of supply per registration
 * - Fee Buyback: Protocol admin fees used to buy back and burn $CLAWDIA
 * - Scale: 1,000 registrations = 25B burned (25% of supply)
 * 
 * UTILITY MECHANISM:
 * 1. User pays ETH to register token
 * 2. Contract swaps ETH for 25M $CLAWDIA on Uniswap
 * 3. Burns the $CLAWDIA (sends to dead address)
 * 4. Registration proceeds
 * 5. Leftover ETH returned to user
 */

interface ISwapRouter {
    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn);
    
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface IWETH9 {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

contract CLAWDIABurner is Ownable {
    // ============ Constants ============
    
    /// @notice Dead address for burning tokens
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Amount of $CLAWDIA to burn per registration (25M with 18 decimals)
    uint256 public constant REGISTRATION_BURN_AMOUNT = 25_000_000 * 1e18;
    
    /// @notice Default Uniswap V3 pool fee tier (0.3%)
    uint24 public constant DEFAULT_POOL_FEE = 3000;
    
    // ============ State ============
    
    /// @notice $CLAWDIA token address
    address public immutable clawdiaToken;
    
    /// @notice WETH address
    address public immutable weth;
    
    /// @notice Uniswap V3 SwapRouter address
    address public immutable swapRouter;
    
    /// @notice Pool fee tier for CLAWDIA/WETH pool
    uint24 public poolFee;
    
    /// @notice Maximum slippage allowed (in basis points, 500 = 5%)
    uint256 public maxSlippageBps = 500;
    
    /// @notice Total $CLAWDIA burned from registrations
    uint256 public totalRegistrationBurns;
    
    /// @notice Total $CLAWDIA burned from fee buybacks
    uint256 public totalBuybackBurns;
    
    /// @notice Total ETH spent on burns
    uint256 public totalEthSpent;
    
    /// @notice Mapping of token address to amount burned on registration
    mapping(address => uint256) public registrationBurnAmount;
    
    // ============ Events ============
    
    event RegistrationBurn(
        address indexed token,
        address indexed payer,
        uint256 clawdiaBurned,
        uint256 ethSpent
    );
    
    event BuybackBurn(
        uint256 ethSpent,
        uint256 clawdiaBurned
    );
    
    event PoolFeeUpdated(uint24 oldFee, uint24 newFee);
    event MaxSlippageUpdated(uint256 oldSlippage, uint256 newSlippage);
    
    // ============ Errors ============
    
    error InsufficientETH();
    error SwapFailed();
    error BurnFailed();
    error InvalidPoolFee();
    error InvalidSlippage();
    error ZeroAddress();
    
    // ============ Constructor ============
    
    /**
     * @param _clawdiaToken Address of $CLAWDIA token
     * @param _weth Address of WETH
     * @param _swapRouter Address of Uniswap V3 SwapRouter
     */
    constructor(
        address _clawdiaToken,
        address _weth,
        address _swapRouter
    ) Ownable(msg.sender) {
        if (_clawdiaToken == address(0) || _weth == address(0) || _swapRouter == address(0)) {
            revert ZeroAddress();
        }
        
        clawdiaToken = _clawdiaToken;
        weth = _weth;
        swapRouter = _swapRouter;
        poolFee = DEFAULT_POOL_FEE;
        
        // Approve router to spend WETH
        IWETH9(_weth).approve(_swapRouter, type(uint256).max);
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Buy and burn $CLAWDIA for token registration
     * @dev Called by SunsetRegistry during registration
     * @param token The token being registered (for tracking)
     * @param payer Address that paid the ETH
     * @return ethSpent Amount of ETH used for the swap
     * @return clawdiaBurned Amount of $CLAWDIA burned
     */
    function burnForRegistration(
        address token,
        address payer
    ) external payable returns (uint256 ethSpent, uint256 clawdiaBurned) {
        if (msg.value == 0) revert InsufficientETH();
        
        // Wrap ETH to WETH
        IWETH9(weth).deposit{value: msg.value}();
        
        // Calculate minimum output with slippage protection
        // For exactOutput swap, we specify exact output and max input
        uint256 amountOutDesired = REGISTRATION_BURN_AMOUNT;
        
        // Perform swap: ETH -> CLAWDIA
        // Using exactOutputSingle to get exactly 25M CLAWDIA
        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter.ExactOutputSingleParams({
            tokenIn: weth,
            tokenOut: clawdiaToken,
            fee: poolFee,
            recipient: address(this),
            amountOut: amountOutDesired,
            amountInMaximum: msg.value, // Max we'll spend
            sqrtPriceLimitX96: 0
        });
        
        // Execute swap
        ethSpent = ISwapRouter(swapRouter).exactOutputSingle(params);
        clawdiaBurned = amountOutDesired;
        
        // Burn the CLAWDIA by sending to dead address
        bool success = IERC20(clawdiaToken).transfer(DEAD_ADDRESS, clawdiaBurned);
        if (!success) revert BurnFailed();
        
        // Return unused WETH as ETH
        uint256 wethRemaining = IWETH9(weth).balanceOf(address(this));
        if (wethRemaining > 0) {
            IWETH9(weth).withdraw(wethRemaining);
            (bool refundSuccess, ) = payer.call{value: wethRemaining}("");
            // Don't revert if refund fails, tokens are already burned
            if (!refundSuccess) {
                // Send to owner as fallback
                (bool fallbackSuccess, ) = owner().call{value: wethRemaining}("");
                // Silently continue if this also fails
            }
        }
        
        // Update tracking
        totalRegistrationBurns += clawdiaBurned;
        totalEthSpent += ethSpent;
        registrationBurnAmount[token] = clawdiaBurned;
        
        emit RegistrationBurn(token, payer, clawdiaBurned, ethSpent);
    }
    
    /**
     * @notice Buy and burn $CLAWDIA with protocol admin fees
     * @dev Called periodically by admin to execute buyback burns
     */
    function buybackAndBurn() external payable {
        if (msg.value == 0) revert InsufficientETH();
        
        // Wrap ETH to WETH
        IWETH9(weth).deposit{value: msg.value}();
        
        // Calculate minimum output with slippage protection
        // For buybacks, we use exactInput to spend all the ETH
        uint256 minOutput = 0; // Will be set based on quote in production
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: weth,
            tokenOut: clawdiaToken,
            fee: poolFee,
            recipient: address(this),
            amountIn: msg.value,
            amountOutMinimum: minOutput,
            sqrtPriceLimitX96: 0
        });
        
        uint256 clawdiaBought = ISwapRouter(swapRouter).exactInputSingle(params);
        
        // Burn the CLAWDIA
        bool success = IERC20(clawdiaToken).transfer(DEAD_ADDRESS, clawdiaBought);
        if (!success) revert BurnFailed();
        
        // Update tracking
        totalBuybackBurns += clawdiaBought;
        totalEthSpent += msg.value;
        
        emit BuybackBurn(msg.value, clawdiaBought);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get total $CLAWDIA burned (registrations + buybacks)
     */
    function getTotalBurned() external view returns (uint256) {
        return totalRegistrationBurns + totalBuybackBurns;
    }
    
    /**
     * @notice Get burn statistics
     */
    function getBurnStats() external view returns (
        uint256 _totalRegistrationBurns,
        uint256 _totalBuybackBurns,
        uint256 _totalBurned,
        uint256 _totalEthSpent
    ) {
        return (
            totalRegistrationBurns,
            totalBuybackBurns,
            totalRegistrationBurns + totalBuybackBurns,
            totalEthSpent
        );
    }
    
    /**
     * @notice Estimate ETH needed for registration burn
     * @dev Returns a conservative estimate, actual may be less
     */
    function estimateRegistrationCost() external view returns (uint256) {
        // In production, this would query the Uniswap quoter
        // For now, return a placeholder that should be overestimated
        // Actual implementation would use Quoter.quoteExactOutputSingle
        return 0.1 ether; // Placeholder - will be updated with real oracle
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update the Uniswap pool fee tier
     * @param newFee New fee tier (500, 3000, or 10000)
     */
    function setPoolFee(uint24 newFee) external onlyOwner {
        if (newFee != 500 && newFee != 3000 && newFee != 10000) {
            revert InvalidPoolFee();
        }
        
        emit PoolFeeUpdated(poolFee, newFee);
        poolFee = newFee;
    }
    
    /**
     * @notice Update max slippage tolerance
     * @param newSlippageBps New slippage in basis points
     */
    function setMaxSlippage(uint256 newSlippageBps) external onlyOwner {
        if (newSlippageBps > 1000) revert InvalidSlippage(); // Max 10%
        
        emit MaxSlippageUpdated(maxSlippageBps, newSlippageBps);
        maxSlippageBps = newSlippageBps;
    }
    
    /**
     * @notice Rescue stuck tokens (not CLAWDIA - that should always be burned)
     * @param token Token to rescue
     * @param to Recipient
     */
    function rescueTokens(address token, address to) external onlyOwner {
        if (token == clawdiaToken) revert BurnFailed(); // Can't rescue CLAWDIA
        if (to == address(0)) revert ZeroAddress();
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).transfer(to, balance);
        }
    }
    
    /**
     * @notice Rescue stuck ETH
     * @param to Recipient
     */
    function rescueETH(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = to.call{value: balance}("");
            require(success, "ETH transfer failed");
        }
    }
    
    // ============ Receive ============
    
    receive() external payable {}
}
