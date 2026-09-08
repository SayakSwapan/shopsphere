import { load } from "@cashfreepayments/cashfree-js";

export interface CashfreeCheckoutResult {
  /** True when the Cashfree payment page was completed and the modal closed. */
  redirect: boolean;
}

/**
 * Opens the Cashfree hosted checkout modal for a payment session.
 *
 * The return value only tells us the modal closed — payment truth always comes
 * from the server-side verify call (Cashfree payments API), never from here.
 *
 * Env: NEXT_PUBLIC_CASHFREE_ENV = "sandbox" | "production"
 */
export async function openCashfreeCheckout(
  paymentSessionId: string
): Promise<CashfreeCheckoutResult> {
  const mode =
    process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
      ? "production"
      : "sandbox";

  const cashfree = await load({ mode });

  const result = await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "modal",
  });

  return { redirect: Boolean(result?.redirect) };
}