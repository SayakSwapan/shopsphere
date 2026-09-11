import { load } from "@cashfreepayments/cashfree-js";

let preloadPromise: Promise<void> | null = null;

/**
 * Starts loading the Cashfree SDK in the background so the hosted checkout
 * can open with no extra network round-trip when the buyer taps
 * "Proceed to Payment". Safe to call anytime — it is idempotent and never
 * throws to the caller.
 */
export function preloadCashfree(
  mode: "production" | "sandbox"
): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = load({ mode })
      .then(() => undefined)
      .catch((err) => {
        // The real error shows when the checkout is actually opened.
        console.error("[cashfree-checkout] preload failed", err);
        preloadPromise = null; // allow a retry during the real open
      });
  }
  return preloadPromise;
}

/**
 * Launches the Cashfree hosted checkout for a payment session.
 *
 * `redirectTarget: "self"` keeps the buyer on the SAME tab — the current
 * window navigates to Cashfree's checkout page instead of a popup/new tab.
 * Once the payment completes (or is cancelled), Cashfree redirects the
 * browser back to the merchant return_url we set when creating the session
 * (/payment/result?orderId=...), where the server verifies the outcome.
 *
 * `mode` is REQUIRED and must exactly match the environment that created the
 * session server-side (`cashfreeClientMode()`). Passing `"sandbox"` for a
 * production session (or vice-versa) makes Cashfree refuse to load the SDK.
 */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "production" | "sandbox"
): Promise<{ redirect: boolean }> {
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
    // Reuse the background-preloaded SDK when available, otherwise load it
    // right away. Either way the buyer is no longer stuck waiting on a
    // cold script fetch after the session is already created.
    if (preloadPromise) await preloadPromise;
    cashfree = await load({ mode: effectiveMode });
  } catch (err) {
    console.error("[cashfree-checkout] SDK load failed", err);
    throw new Error(
      "The payment page could not be loaded. Please allow scripts from sdk.cashfree.com (or disable your ad blocker) and try again."
    );
  }

  try {
    await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "self",
    });
    // With redirectTarget "self" the browser is already being navigated to the
    // Cashfree checkout page; the order outcome is confirmed by /payment/result.
    return { redirect: true };
  } catch (err) {
    console.error("[cashfree-checkout] checkout failed", err);
    const message =
      err instanceof Error && err.message
        ? err.message
        : "The payment page failed to open.";
    throw new Error(`Payment window error: ${message}`);
  }
}