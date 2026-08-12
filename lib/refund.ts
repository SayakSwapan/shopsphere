export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifsc: string;
  upiId?: string | null;
}

export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const UPI_PATTERN = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;

export interface BankDetailsInput {
  accountHolder?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  upiId?: string | null;
}

export type BankDetailsResult =
  | { ok: true; data: BankDetails }
  | { ok: false; error: string };

export function validateBankDetails(input: BankDetailsInput): BankDetailsResult {
  const accountHolder = input.accountHolder?.trim() ?? "";
  const accountNumber = input.accountNumber?.trim() ?? "";
  const confirmAccountNumber = input.confirmAccountNumber?.trim() ?? "";
  const bankName = input.bankName?.trim() ?? "";
  const branchName = input.branchName?.trim() ?? "";
  const ifsc = input.ifsc?.trim().toUpperCase() ?? "";
  const upiId = input.upiId?.trim().toLowerCase() ?? "";

  if (!accountHolder) {
    return { ok: false, error: "Account holder name is required" };
  }
  if (!/^\d{9,18}$/.test(accountNumber)) {
    return { ok: false, error: "Enter a valid account number (9-18 digits)" };
  }
  if (accountNumber !== confirmAccountNumber) {
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
  if (upiId && !UPI_PATTERN.test(upiId)) {
    return { ok: false, error: "Enter a valid UPI ID (e.g. name@bank)" };
  }

  return {
    ok: true,
    data: { accountHolder, accountNumber, bankName, branchName, ifsc, upiId: upiId || null },
  };
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
