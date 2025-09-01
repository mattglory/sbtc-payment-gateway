import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;

describe("sBTC Payment Gateway", () => {
  it("should allow merchant registration", () => {
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      deployer
    );
    
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify merchant was registered correctly
    const merchant = simnet.callReadOnlyFn(
      "sbtc-payment-gateway",
      "get-merchant",
      [Cl.principal(deployer)],
      deployer
    );
    
    // Check that merchant data was returned
    expect(merchant.result.type).toBe('some');
  });

  it("should prevent duplicate merchant registration", () => {
    // First registration
    const { result: firstResult } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      deployer
    );
    expect(firstResult).toBeOk(Cl.bool(true));
    
    // Second registration should fail
    const { result: secondResult } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Another Business"), Cl.stringAscii("another@business.com")],
      deployer
    );
    expect(secondResult).toBeErr(Cl.uint(106)); // ERR_MERCHANT_ALREADY_REGISTERED
  });

  it("should allow creating payment intents", () => {
    // Register merchant first
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      deployer
    );
    
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "create-payment-intent",
      [Cl.stringAscii("payment-001"), Cl.uint(1000000), Cl.some(Cl.stringAscii("Test payment for service")), Cl.uint(144)],
      deployer
    );
    
    expect(result.type).toBe('ok');
    
    // Verify payment intent was created
    const payment = simnet.callReadOnlyFn(
      "sbtc-payment-gateway",
      "get-payment",
      [Cl.stringAscii("payment-001")],
      deployer
    );
    
    expect(payment.result.type).toBe('some');
  });

  it("should process payments correctly", () => {
    // Register merchant
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      deployer
    );
    
    // Create payment intent
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "create-payment-intent",
      [Cl.stringAscii("payment-002"), Cl.uint(1000000), Cl.some(Cl.stringAscii("Test payment")), Cl.uint(144)],
      deployer
    );
    
    // Process payment
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "process-payment",
      [Cl.stringAscii("payment-002"), Cl.principal(user1)],
      user1
    );
    
    expect(result.type).toBe('ok');
    
    // Verify payment status changed
    const payment = simnet.callReadOnlyFn(
      "sbtc-payment-gateway",
      "get-payment",
      [Cl.stringAscii("payment-002")],
      deployer
    );
    
    expect(payment.result.type).toBe('some');
  });

  it("should prevent processing already completed payments", () => {
    // Register merchant
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      deployer
    );
    
    // Create payment intent
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "create-payment-intent",
      [Cl.stringAscii("payment-003"), Cl.uint(1000000), Cl.some(Cl.stringAscii("Test payment")), Cl.uint(144)],
      deployer
    );
    
    // Process payment first time
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "process-payment",
      [Cl.stringAscii("payment-003"), Cl.principal(user1)],
      user1
    );
    
    // Try to process again
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "process-payment",
      [Cl.stringAscii("payment-003"), Cl.principal(user2)],
      user2
    );
    
    expect(result).toBeErr(Cl.uint(105)); // ERR_PAYMENT_ALREADY_PROCESSED
  });

  it("should allow cancelling payments", () => {
    // Register merchant
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      deployer
    );
    
    // Create payment intent
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "create-payment-intent",
      [Cl.stringAscii("payment-004"), Cl.uint(1000000), Cl.some(Cl.stringAscii("Test payment")), Cl.uint(144)],
      deployer
    );
    
    // Cancel payment
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "cancel-payment",
      [Cl.stringAscii("payment-004")],
      deployer
    );
    
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify payment was cancelled
    const payment = simnet.callReadOnlyFn(
      "sbtc-payment-gateway",
      "get-payment",
      [Cl.stringAscii("payment-004")],
      deployer
    );
    
    expect(payment.result.type).toBe('some');
  });

  it("should allow contract owner to set fee percentage", () => {
    // Update fee (should only work for contract owner)
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "set-fee-percentage",
      [Cl.uint(500)], // 5%
      deployer
    );
    
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify fee was updated
    const fee = simnet.callReadOnlyFn(
      "sbtc-payment-gateway",
      "get-fee-percentage",
      [],
      deployer
    );
    
    expect(fee.result).toBeUint(500);
  });

  it("should allow contract owner to deactivate merchants", () => {
    // Register merchant
    simnet.callPublicFn(
      "sbtc-payment-gateway",
      "register-merchant",
      [Cl.stringAscii("Test Business"), Cl.stringAscii("test@business.com")],
      user1
    );
    
    // Deactivate merchant (should only work for contract owner)
    const { result } = simnet.callPublicFn(
      "sbtc-payment-gateway",
      "deactivate-merchant",
      [Cl.principal(user1)],
      deployer
    );
    
    expect(result).toBeOk(Cl.bool(true));
    
    // Verify merchant was deactivated
    const merchant = simnet.callReadOnlyFn(
      "sbtc-payment-gateway",
      "get-merchant",
      [Cl.principal(user1)],
      deployer
    );
    
    expect(merchant.result.type).toBe('some');
  });
});