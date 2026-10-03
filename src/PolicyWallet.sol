// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IUSYCVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
}

/// @title PolicyWallet - On-Chain Safety & Execution Boundary for Autonomous Corporate Finance
/// @notice Enforces daily spending limits, category caps, vendor whitelists, USYC yield sweeps, 
/// and an agent-proposed, owner-approved escalation workflow for over-limit transactions.
contract PolicyWallet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IUSYCVault public immutable usycVault;
    address public agentAddress;

    uint256 public dailyLimit;
    uint256 public maxSingleTx;
    uint256 public lastResetTimestamp;
    uint256 public spentToday;
    uint256 public escalationNonce;

    uint256 public constant ESCALATION_EXPIRY = 3 days;

    struct PendingTx {
        address vendor;
        uint256 amount;
        bytes32 category;
        string invoiceRef;
        bytes32 reasoningHash;
        uint256 createdAt;
        bool agentApproved;
        bool ownerApproved;
        bool executed;
        bool cancelled;
    }

    mapping(address => bool) public whitelistedVendors;
    mapping(bytes32 => uint256) public categorySpentToday;
    mapping(bytes32 => uint256) public categoryDailyLimit;
    mapping(bytes32 => PendingTx) public pendingTransactions;

    event PayoutExecuted(address indexed vendor, uint256 amount, bytes32 indexed category, string invoiceRef);
    event PayoutEscalated(bytes32 indexed txId, address indexed vendor, uint256 amount, bytes32 indexed category, string invoiceRef);
    event EscalatedPayoutApproved(bytes32 indexed txId, address indexed vendor, uint256 amount);
    event EscalationCancelled(bytes32 indexed txId);
    event YieldSwept(uint256 amountUsdc);
    event YieldRedeemed(uint256 amountUsdc);

    modifier onlyAgent() {
        require(msg.sender == agentAddress, "Caller is not authorized agent");
        _;
    }

    constructor(
        address _usdc, 
        address _usycVault, 
        address _agent, 
        uint256 _dailyLimit, 
        uint256 _maxSingleTx
    ) Ownable(msg.sender) {
        require(_usdc != address(0) && _usycVault != address(0) && _agent != address(0), "Invalid addresses");
        usdc = IERC20(_usdc);
        usycVault = IUSYCVault(_usycVault);
        agentAddress = _agent;
        dailyLimit = _dailyLimit;
        maxSingleTx = _maxSingleTx;
        lastResetTimestamp = block.timestamp;
    }

    /// @notice Direct automated payout for standard transactions <= maxSingleTx
    function executePayout(
        address vendor, 
        uint256 amount, 
        bytes32 category, 
        string calldata invoiceRef
    ) external onlyAgent nonReentrant {
        _resetLimitsIfNewDay();
        require(whitelistedVendors[vendor], "Vendor not whitelisted");
        require(amount <= maxSingleTx, "Exceeds max single tx threshold; must use requestEscalatedPayout");
        require(spentToday + amount <= dailyLimit, "Breaches global daily limit");
        require(categorySpentToday[category] + amount <= categoryDailyLimit[category], "Breaches category daily limit");

        spentToday += amount;
        categorySpentToday[category] += amount;

        usdc.safeTransfer(vendor, amount);
        emit PayoutExecuted(vendor, amount, category, invoiceRef);
    }

    /// @notice Agent submits over-limit transaction to on-chain escalation queue
    /// @dev Uses incremental escalationNonce to prevent hash collisions in same block
    function requestEscalatedPayout(
        address vendor,
        uint256 amount,
        bytes32 category,
        string calldata invoiceRef,
        bytes32 reasoningHash
    ) external onlyAgent returns (bytes32 txId) {
        require(whitelistedVendors[vendor], "Vendor not whitelisted");
        
        escalationNonce++;
        txId = keccak256(abi.encodePacked(vendor, amount, category, invoiceRef, escalationNonce, address(this)));

        pendingTransactions[txId] = PendingTx({
            vendor: vendor,
            amount: amount,
            category: category,
            invoiceRef: invoiceRef,
            reasoningHash: reasoningHash,
            createdAt: block.timestamp,
            agentApproved: true,
            ownerApproved: false,
            executed: false,
            cancelled: false
        });

        emit PayoutEscalated(txId, vendor, amount, category, invoiceRef);
    }

    /// @notice Human Supervisor / Owner approves and executes pending escalated payout
    /// @dev Intentionally bypasses categoryDailyLimit (acts as human override), but strictly respects global dailyLimit
    function approveAndExecuteEscalatedPayout(bytes32 txId) external onlyOwner nonReentrant {
        PendingTx storage pTx = pendingTransactions[txId];
        require(pTx.agentApproved, "Transaction not requested by agent");
        require(!pTx.executed, "Transaction already executed");
        require(!pTx.cancelled, "Transaction has been cancelled");
        require(block.timestamp <= pTx.createdAt + ESCALATION_EXPIRY, "Escalated transaction expired");

        _resetLimitsIfNewDay();
        require(spentToday + pTx.amount <= dailyLimit, "Breaches global daily limit");

        pTx.ownerApproved = true;
        pTx.executed = true;
        spentToday += pTx.amount;
        categorySpentToday[pTx.category] += pTx.amount;

        usdc.safeTransfer(pTx.vendor, pTx.amount);
        emit EscalatedPayoutApproved(txId, pTx.vendor, pTx.amount);
    }

    /// @notice Cancels an expired or stale pending escalation request
    function cancelEscalatedPayout(bytes32 txId) external nonReentrant {
        require(msg.sender == owner() || msg.sender == agentAddress, "Unauthorized to cancel");
        PendingTx storage pTx = pendingTransactions[txId];
        require(pTx.agentApproved, "Transaction not requested");
        require(!pTx.executed, "Cannot cancel executed transaction");
        require(!pTx.cancelled, "Transaction already cancelled");

        pTx.cancelled = true;
        emit EscalationCancelled(txId);
    }

    /// @notice Sweeps liquid USDC into USYC Vault using proper ERC20 approve + deposit sequence
    function sweepToUSYC(uint256 amount) external onlyAgent nonReentrant {
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient liquid USDC");
        
        usdc.forceApprove(address(usycVault), amount);
        usycVault.deposit(amount);
        
        emit YieldSwept(amount);
    }

    /// @notice Redeems USYC back to USDC and verifies receiving balance in contract
    function redeemUSYC(uint256 amount) external onlyAgent nonReentrant {
        uint256 balanceBefore = usdc.balanceOf(address(this));
        
        usycVault.withdraw(amount);
        
        uint256 balanceAfter = usdc.balanceOf(address(this));
        require(balanceAfter >= balanceBefore + amount, "USDC not received from USYC redemption");

        emit YieldRedeemed(amount);
    }

    function _resetLimitsIfNewDay() internal {
        if (block.timestamp >= lastResetTimestamp + 1 days) {
            spentToday = 0;
            lastResetTimestamp = block.timestamp;
        }
    }

    function setVendorWhitelist(address vendor, bool status) external onlyOwner {
        whitelistedVendors[vendor] = status;
    }

    function setCategoryLimit(bytes32 category, uint256 limit) external onlyOwner {
        categoryDailyLimit[category] = limit;
    }

    function updateAgentAddress(address newAgent) external onlyOwner {
        require(newAgent != address(0), "Invalid agent address");
        agentAddress = newAgent;
    }

    function setDailyLimit(uint256 newLimit) external onlyOwner {
        dailyLimit = newLimit;
    }

    function setMaxSingleTx(uint256 newMax) external onlyOwner {
        maxSingleTx = newMax;
    }
}
