export type RefundMethodType = "BANK" | "UPI";

export interface BankDetails {
  type?: RefundMethodType;
  accountHolder?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  ifsc?: string | null;
  upiId?: string | null;
}

export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const UPI_PATTERN = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;

export interface BankDetailsInput {
  type?: RefundMethodType;
  accountHolder?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  upiId?: string | null;
}

/** A saved refund method stored on the user's profile (user_refund_method). */
export interface RefundMethodRecord extends BankDetails {
  id: string;
  isDefault: boolean;
  createdAt: string;
}

export type BankDetailsResult =
  | { ok: true; data: BankDetails }
  | { ok: false; error: string };

/**
 * Validates a refund destination. A customer can use either a bank account
 * (account holder + account number + bank + branch + IFSC) OR a UPI ID.
 * When `type` is not explicit it is inferred from whichever set is filled.
 */
export function validateRefundMethod(input: BankDetailsInput): BankDetailsResult {
  const accountHolder = input.accountHolder?.trim() ?? "";
  const accountNumber = input.accountNumber?.trim() ?? "";
  const confirmAccountNumber = input.confirmAccountNumber?.trim() ?? "";
  const bankName = input.bankName?.trim() ?? "";
  const branchName = input.branchName?.trim() ?? "";
  const ifsc = input.ifsc?.trim().toUpperCase() ?? "";
  const upiId = input.upiId?.trim().toLowerCase() ?? "";

  const hasBank = Boolean(accountNumber || ifsc || accountHolder || bankName || branchName);
  const type: RefundMethodType =
    input.type === "UPI" || (input.type !== "BANK" && upiId && !hasBank) ? "UPI" : "BANK";

  if (type === "UPI") {
    if (!upiId) {
      return { ok: false, error: "UPI ID is required" };
    }
    if (!UPI_PATTERN.test(upiId)) {
      return { ok: false, error: "Enter a valid UPI ID (e.g. name@bank)" };
    }
    return {
      ok: true,
      data: {
        type,
        upiId,
        accountHolder: null,
        accountNumber: null,
        bankName: null,
        branchName: null,
        ifsc: null,
      },
    };
  }

  if (!accountHolder) {
    return { ok: false, error: "Account holder name is required" };
  }
  if (!/^\d{9,18}$/.test(accountNumber)) {
    return { ok: false, error: "Enter a valid account number (9-18 digits)" };
  }
  if (confirmAccountNumber && accountNumber !== confirmAccountNumber) {
    return { ok: false, error: "Account numbers do not match. Please re-enter them" };
  }
  if (!bankName) {
    return { ok: false, error: "Bank name is required" };
  }
  if (!branchName) {
    return { ok: false, error: "Branch name is required" };
  }
  if (!IFSC_PATTERN.test(ifsc)) {
    return { ok: false, error: "Enter a valid IFSC code (e.g. HDFC0001234)" };
  }

  return {
    ok: true,
    data: {
      type,
      accountHolder,
      accountNumber,
      bankName,
      branchName,
      ifsc,
      upiId: upiId || null,
    },
  };
}

export function validateBankDetails(input: BankDetailsInput): BankDetailsResult {
  return validateRefundMethod(input);
}

export function maskAccountNumber(accountNumber: string | null | undefined): string {
  const acc = (accountNumber ?? "").trim();
  if (!acc) return "—";
  if (acc.length <= 4) return `•••• ${acc}`;
  return `•••• •••• ${acc.slice(-4)}`;
}

export function isRefundableStatus(status: string): boolean {
  return ["APPROVED", "PICKUP_SCHEDULED", "PICKUP_COMPLETED", "REFUND_INITIATED"].includes(status);
}

export function refundMethodLabel(method: BankDetails): string {
  if (method.type === "UPI") return method.upiId || "UPI ID";
  return `${method.bankName ?? "Bank"} · ${maskAccountNumber(method.accountNumber)}`;
}
