/**
 * Minimal typings for `@cashfreepayments/cashfree-js` (the package ships no
 * declarations). Deliberately scoped to the API surface we use.
 */
declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeCheckoutResponse {
    redirect?: boolean;
    error?: string | Record<string, unknown>;
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget: "modal";
  }

  export interface CashfreeSDK {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResponse>;
  }

  export type CashfreeMode = "sandbox" | "production";

  export function load(options: { mode: CashfreeMode }): Promise<CashfreeSDK>;
}