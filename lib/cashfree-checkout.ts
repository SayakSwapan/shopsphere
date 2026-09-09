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
 * `mode` is REQUIRED and must exactly match the environment that created the
 * session server-side (`cashfreeClientMode()`). Passing `"sandbox"` for a
 * production session (or vice-versa) makes Cashfree refuse to launch the
 * popup. Fallback to NEXT_PUBLIC_CASHFREE_ENV is kept only as a last resort.
 */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "production" | "sandbox"
): Promise<CashfreeCheckoutResult> {
  if (!paymentSessionId) {
    throw new Error(
      "Payment session is missing. Please go back and try again."
    );
  }

  const effectiveMode =
    mode ??
    (process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
      ? "production"
      : "sandbox");

  let cashfree;
  try {
    cashfree = await load({ mode: effectiveMode });
  } catch (err) {
    console.error("[cashfree-checkout] SDK load failed", err);
    throw new Error(
      "The payment window could not be loaded. Please allow scripts from sdk.cashfree.com (or disable your ad blocker) and try again."
    );
  }

  try {
    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "modal",
    });
    return { redirect: Boolean(result?.redirect) };
  } catch (err) {
    console.error("[cashfree-checkout] checkout failed", err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : "The payment window failed to open.";
    throw new Error(`Payment window error: ${message}`);
  }
}