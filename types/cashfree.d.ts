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
    /** "_self"/"_top" navigate the current tab; "_blank" opens a new tab; "_modal" opens a popup; a DOM element embeds inline. Must be a valid HTML form target — "_self", not "self". */
    redirectTarget: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
  }

  export interface CashfreeSDK {
    checkout(
      options: CashfreeCheckoutOptions,
    ): Promise<CashfreeCheckoutResponse>;
  }

  export type CashfreeMode = "sandbox" | "production";

  export function load(options: { mode: CashfreeMode }): Promise<CashfreeSDK>;
}
