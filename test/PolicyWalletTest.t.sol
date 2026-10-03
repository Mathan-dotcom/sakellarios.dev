// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PolicyWallet.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract MockUSYCVault is IUSYCVault {
    IERC20 public immutable usdc;

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function deposit(uint256 amount) external override {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Deposit transfer failed");
    }

    function withdraw(uint256 amount) external override {
        require(usdc.transfer(msg.sender, amount), "Withdraw transfer failed");
    }
}

contract PolicyWalletTest is Test {
    PolicyWallet public wallet;
    MockUSDC public usdc;
    MockUSYCVault public usycVault;

    address public owner = address(0x111);
    address public agent = address(0x222);
    address public vendor1 = address(0x333);
    address public vendor2 = address(0x444);
    address public maliciousVendor = address(0x555);
    address public randomUser = address(0x999);

    bytes32 public constant CAT_INFRA = keccak256("INFRASTRUCTURE");
    bytes32 public constant CAT_PAYROLL = keccak256("PAYROLL");

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        usycVault = new MockUSYCVault(address(usdc));

        wallet = new PolicyWallet(
            address(usdc),
            address(usycVault),
            agent,
            1000 * 10**6,
            250 * 10**6
        );

        wallet.setVendorWhitelist(vendor1, true);
        wallet.setVendorWhitelist(vendor2, true);
        wallet.setCategoryLimit(CAT_INFRA, 500 * 10**6);
        wallet.setCategoryLimit(CAT_PAYROLL, 800 * 10**6);

        usdc.transfer(address(wallet), 10_000 * 10**6);
        vm.stopPrank();
    }

    // 1. Constructor Validation
    function test_Constructor_RevertIfZeroAddress() public {
        vm.expectRevert("Invalid addresses");
        new PolicyWallet(address(0), address(usycVault), agent, 1000 * 10**6, 250 * 10**6);

        vm.expectRevert("Invalid addresses");
        new PolicyWallet(address(usdc), address(0), agent, 1000 * 10**6, 250 * 10**6);

        vm.expectRevert("Invalid addresses");
        new PolicyWallet(address(usdc), address(usycVault), address(0), 1000 * 10**6, 250 * 10**6);
    }

    // 2. Standard Payout Happy Path
    function test_ExecuteStandardPayout_Success() public {
        vm.prank(agent);
        wallet.executePayout(vendor1, 100 * 10**6, CAT_INFRA, "INV-001");

        assertEq(usdc.balanceOf(vendor1), 100 * 10**6);
        assertEq(wallet.spentToday(), 100 * 10**6);
        assertEq(wallet.categorySpentToday(CAT_INFRA), 100 * 10**6);
    }

    // 3. Standard Payout Revert Non-Whitelisted
    function test_ExecutePayout_RevertIfNotWhitelisted() public {
        vm.prank(agent);
        vm.expectRevert("Vendor not whitelisted");
        wallet.executePayout(maliciousVendor, 50 * 10**6, CAT_INFRA, "INV-002");
    }

    // 4. Standard Payout Revert Exceeds Max Single Tx Threshold
    function test_ExecutePayout_RevertIfExceedsMaxSingleTx() public {
        vm.prank(agent);
        vm.expectRevert("Exceeds max single tx threshold; must use requestEscalatedPayout");
        wallet.executePayout(vendor1, 300 * 10**6, CAT_INFRA, "INV-003");
    }

    // 5. Standard Payout Revert Exceeds Category Daily Cap
    function test_ExecutePayout_RevertIfExceedsCategoryLimit() public {
        vm.startPrank(agent);
        wallet.executePayout(vendor1, 200 * 10**6, CAT_INFRA, "INV-004");
        wallet.executePayout(vendor1, 200 * 10**6, CAT_INFRA, "INV-005");
        
        vm.expectRevert("Breaches category daily limit");
        wallet.executePayout(vendor1, 150 * 10**6, CAT_INFRA, "INV-006");
        vm.stopPrank();
    }

    // 6. Access Control: onlyAgent Enforcement on executePayout
    function test_ExecutePayout_RevertIfNotAgent() public {
        vm.prank(randomUser);
        vm.expectRevert("Caller is not authorized agent");
        wallet.executePayout(vendor1, 50 * 10**6, CAT_INFRA, "INV-UNAUTH");
    }

    // 7. Escalation Request Revert Non-Whitelisted Vendor
    function test_RequestEscalatedPayout_RevertIfNotWhitelisted() public {
        vm.prank(agent);
        vm.expectRevert("Vendor not whitelisted");
        wallet.requestEscalatedPayout(maliciousVendor, 500 * 10**6, CAT_INFRA, "INV-ESC-UNWHITE", keccak256("R"));
    }

    // 8. Access Control: onlyAgent Enforcement on requestEscalatedPayout
    function test_RequestEscalatedPayout_RevertIfNotAgent() public {
        vm.prank(randomUser);
        vm.expectRevert("Caller is not authorized agent");
        wallet.requestEscalatedPayout(vendor1, 500 * 10**6, CAT_INFRA, "INV-ESC-UNAUTH", keccak256("R"));
    }

    // 9. Escalation Workflow Success (Owner Approval & Category Limit Override)
    function test_ApproveEscalation_Success_CategoryOverride() public {
        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(
            vendor1, 
            600 * 10**6, 
            CAT_INFRA, 
            "INV-OVERRIDE-001", 
            keccak256("Large infra upgrade approved by human")
        );

        vm.prank(owner);
        wallet.approveAndExecuteEscalatedPayout(txId);

        assertEq(usdc.balanceOf(vendor1), 600 * 10**6);
        assertEq(wallet.spentToday(), 600 * 10**6);
    }

    // 10. Access Control: onlyOwner Enforcement on approveAndExecuteEscalatedPayout
    function test_ApproveEscalation_RevertIfNotOwner() public {
        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(vendor1, 400 * 10**6, CAT_PAYROLL, "INV-ESC-002", keccak256("R"));

        vm.prank(randomUser);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", randomUser));
        wallet.approveAndExecuteEscalatedPayout(txId);
    }

    // 11. Escalation Approval Revert Global Daily Limit Breach
    function test_ApproveEscalation_RevertIfBreachesGlobalDailyLimit() public {
        vm.prank(agent);
        wallet.executePayout(vendor1, 200 * 10**6, CAT_INFRA, "INV-PRE");

        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(vendor1, 900 * 10**6, CAT_PAYROLL, "INV-ESC-OVER", keccak256("R"));

        vm.prank(owner);
        vm.expectRevert("Breaches global daily limit");
        wallet.approveAndExecuteEscalatedPayout(txId);
    }

    // 12. Replay Protection: Double-Execution Attempt Revert
    function test_ApproveEscalation_RevertIfDoubleExecuted() public {
        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(vendor1, 300 * 10**6, CAT_PAYROLL, "INV-ESC-DBL", keccak256("R"));

        vm.prank(owner);
        wallet.approveAndExecuteEscalatedPayout(txId);

        vm.prank(owner);
        vm.expectRevert("Transaction already executed");
        wallet.approveAndExecuteEscalatedPayout(txId);
    }

    // 13. Timeout Protection: Escalation Expiry (3 Days)
    function test_ApproveEscalation_RevertIfExpired() public {
        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(vendor1, 400 * 10**6, CAT_PAYROLL, "INV-PAY-EXP", keccak256("R"));

        vm.warp(block.timestamp + 4 days);

        vm.prank(owner);
        vm.expectRevert("Escalated transaction expired");
        wallet.approveAndExecuteEscalatedPayout(txId);
    }

    // 14. Cancellation Success by Agent or Owner
    function test_CancelEscalation_Success_ByAgentAndOwner() public {
        vm.prank(agent);
        bytes32 txId1 = wallet.requestEscalatedPayout(vendor1, 400 * 10**6, CAT_PAYROLL, "INV-CANC-1", keccak256("R1"));
        
        vm.prank(agent);
        bytes32 txId2 = wallet.requestEscalatedPayout(vendor1, 400 * 10**6, CAT_PAYROLL, "INV-CANC-2", keccak256("R2"));

        vm.prank(agent);
        wallet.cancelEscalatedPayout(txId1);

        vm.prank(owner);
        wallet.cancelEscalatedPayout(txId2);

        vm.prank(owner);
        vm.expectRevert("Transaction has been cancelled");
        wallet.approveAndExecuteEscalatedPayout(txId1);
    }

    // 15. Cancellation Revert Unauthorized Caller
    function test_CancelEscalation_RevertIfUnauthorized() public {
        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(vendor1, 400 * 10**6, CAT_PAYROLL, "INV-CANC-UNAUTH", keccak256("R"));

        vm.prank(randomUser);
        vm.expectRevert("Unauthorized to cancel");
        wallet.cancelEscalatedPayout(txId);
    }

    // 16. Cancellation Revert Already Executed
    function test_CancelEscalation_RevertIfAlreadyExecuted() public {
        vm.prank(agent);
        bytes32 txId = wallet.requestEscalatedPayout(vendor1, 300 * 10**6, CAT_PAYROLL, "INV-CANC-EXEC", keccak256("R"));

        vm.prank(owner);
        wallet.approveAndExecuteEscalatedPayout(txId);

        vm.prank(owner);
        vm.expectRevert("Cannot cancel executed transaction");
        wallet.cancelEscalatedPayout(txId);
    }

    // 17. Sweep and Redeem USYC Yield Happy Path
    function test_SweepAndRedeemUSYC_Success() public {
        vm.prank(owner);
        usdc.transfer(address(usycVault), 5_000 * 10**6);

        vm.prank(agent);
        wallet.sweepToUSYC(2_000 * 10**6);
        assertEq(usdc.balanceOf(address(usycVault)), 7_000 * 10**6);

        vm.prank(agent);
        wallet.redeemUSYC(1_000 * 10**6);
        assertEq(usdc.balanceOf(address(wallet)), 9_000 * 10**6);
    }

    // 18. Access Control: onlyAgent Enforcement on sweepToUSYC and redeemUSYC
    function test_SweepAndRedeemUSYC_RevertIfNotAgent() public {
        vm.prank(randomUser);
        vm.expectRevert("Caller is not authorized agent");
        wallet.sweepToUSYC(1_000 * 10**6);

        vm.prank(randomUser);
        vm.expectRevert("Caller is not authorized agent");
        wallet.redeemUSYC(1_000 * 10**6);
    }

    // 19. USYC Sweep Revert Insufficient Balance
    function test_SweepUSYC_RevertIfInsufficientBalance() public {
        vm.prank(agent);
        vm.expectRevert("Insufficient liquid USDC");
        wallet.sweepToUSYC(50_000 * 10**6);
    }

    // 20. Same-Block Escalation Nonce Uniqueness Assertion
    function test_EscalationNonceUniquenessInSameBlock() public {
        vm.startPrank(agent);
        bytes32 txId1 = wallet.requestEscalatedPayout(vendor1, 300 * 10**6, CAT_PAYROLL, "INV-SAME-BLOCK", keccak256("R1"));
        bytes32 txId2 = wallet.requestEscalatedPayout(vendor1, 300 * 10**6, CAT_PAYROLL, "INV-SAME-BLOCK", keccak256("R2"));
        
        assertTrue(txId1 != txId2);
        vm.stopPrank();
    }

    // 21. Admin Setters and Zero-Address Validation
    function test_AdminSetters_Success_And_Reverts() public {
        address newAgent = address(0x777);
        
        vm.prank(owner);
        wallet.updateAgentAddress(newAgent);
        assertEq(wallet.agentAddress(), newAgent);

        vm.prank(owner);
        vm.expectRevert("Invalid agent address");
        wallet.updateAgentAddress(address(0));

        vm.startPrank(owner);
        wallet.setDailyLimit(2000 * 10**6);
        assertEq(wallet.dailyLimit(), 2000 * 10**6);

        wallet.setMaxSingleTx(500 * 10**6);
        assertEq(wallet.maxSingleTx(), 500 * 10**6);

        wallet.setCategoryLimit(CAT_INFRA, 1000 * 10**6);
        assertEq(wallet.categoryDailyLimit(CAT_INFRA), 1000 * 10**6);
        vm.stopPrank();

        vm.prank(randomUser);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", randomUser));
        wallet.setDailyLimit(3000 * 10**6);
    }
}
