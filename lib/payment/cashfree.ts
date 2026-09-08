/**
 * Cashfree Payment Gateway — server-side client (temporarily replacing
 * Razorpay as the online gateway).
 *
 * Flow:
 *  1. createPaymentSession()  → /pg/orders → payment_session_id
 *  2. Client opens the Cashfree checkout modal with that session id
 *  3. On modal close, the server verifies the outcome by calling
 *     fetchPayment(orderId) — we never trust an amount/signature reported
 *     by the browser; the order is only marked PAID when Cashfree's own
 *     API returns a SUCCESS payment for our order id.
 *
 * Env vars:
 *  CASHFREE_CLIENT_ID       API key (test_: prefixes for sandbox)
 *  CASHFREE_CLIENT_SECRET   API secret
* CASHFREE_ENV             "TEST" or "PROD"
 */
export class CashfreeError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export function cashfreeEnabled(): boolean {
  return Boolean(
    process.env.CASHFREE_CLIENT_ID &&
      process.env.CASHFREE_CLIENT_SECRET
  );
}

function cashfreeBaseUrl(): string {
  return process.env.CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
}

function cashfreeHeaders(): Record<string, string> {
  return {
    "x-api-version": "2023-08-01",
    "x-client-id": process.env.CASHFREE_CLIENT_ID!,
    "x-client-secret": process.env.CASHFREE_CLIENT_SECRET!,
    "Content-Type": "application/json",
  };
}

export interface CashfreeCustomer {
  /** Stable id of the customer (we use the db user id). */
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface CashfreeSession {
  cfOrderId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentSessionId: string;
}

export interface CashfreePayment {
  paymentId: string;
  orderId: string;
  amount: number;
  status: string;
  method: string | null;
  captured: boolean;
}

interface CashfreeCreateOrderResponse {
  cf_order_id?: string;
  order_id?: string;
  order_amount?: string | number;
  order_currency?: string;
  payment_session_id?: string;
  message?: string;
}

interface CashfreePaymentRaw {
  payment_id?: string;
  cf_payment_id?: string;
  order_id?: string;
  order_amount?: string | number;
  payment_amount?: string | number;
  payment_status?: string;
  payment_method?: unknown;
  captured?: boolean;
}

interface CashfreeErrorBody {
  message?: string;
}

async function cashfreeFetch(
  path: string,
  init?: RequestInit
): Promise<unknown> {
  if (!cashfreeEnabled()) {
    throw new CashfreeError("Cashfree is not configured.", 503);
  }
  const res = await fetch(`${cashfreeBaseUrl()}${path}`, {
    ...init,
    headers: { ...cashfreeHeaders(), ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new CashfreeError(
      `Cashfree ${init?.method === "POST" ? "order" : "payment"} request failed (${res.status}): ${
        (data as CashfreeErrorBody)?.message ?? JSON.stringify(data).slice(0, 200)
      }`,
      res.status
    );
  }
  return data;
}

/**
 * Create a Cashfree payment session (also registers the order on Cashfree's
 * side). `orderId` must be unique per merchant — we use the db order.id.
 */
export async function createPaymentSession(input: {
  orderId: string;
  amount: number;
  customer: CashfreeCustomer;
  note?: string;
}): Promise<CashfreeSession> {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const body = {
    order_id: input.orderId,
    order_amount: amount,
    order_currency: "INR",
    order_note: input.note ?? "Order Payment",
    customer_details: {
      customer_id: input.customer.customerId,
      customer_name: input.customer.customerName,
      customer_email: input.customer.customerEmail,
      customer_phone: input.customer.customerPhone,
    },
  };

  const data = (await cashfreeFetch("/pg/orders", {
    method: "POST",
    body: JSON.stringify(body),
  })) as Partial<CashfreeCreateOrderResponse>;

  if (!data?.payment_session_id) {
    throw new CashfreeError("Cashfree did not return a payment session.");
  }

  return {
    cfOrderId: data.cf_order_id ?? input.orderId,
    orderId: data.order_id ?? input.orderId,
    amount: Number(data.order_amount ?? amount),
    currency: data.order_currency ?? "INR",
    paymentSessionId: data.payment_session_id,
  };
}

/**
 * Fetch the latest payment attempt for an order and map it to a simple shape.
 * Returns `null` when Cashfree has no payment record for the order yet.
 */
export async function fetchPayment(orderId: string): Promise<CashfreePayment | null> {
  let data: unknown;
  try {
    data = await cashfreeFetch(
      `/pg/orders/${encodeURIComponent(orderId)}/payments`
    );
  } catch (err) {
    console.error("[cashfree.fetchPayment] API error for", orderId, err);
    throw err;
  }
  const raw = data as { data?: CashfreePaymentRaw[] };
  console.log("[cashfree.fetchPayment] raw response for", orderId, JSON.stringify(raw).slice(0, 1000));
  const payments: CashfreePaymentRaw[] = Array.isArray(raw?.data) ? raw.data : [];
  // Cashfree returns attempts newest-first; pick the most recent one.
  const latest = payments[0];
  if (!latest) return null;

  return {
    paymentId: latest.payment_id ?? latest.cf_payment_id ?? "unknown",
    orderId: latest.order_id ?? orderId,
    amount: Number(latest.payment_amount ?? latest.order_amount ?? 0),
    status: latest.payment_status ?? "UNKNOWN",
    method:
      typeof latest.payment_method === "string" ? latest.payment_method : null,
    captured: Boolean(latest.payment_status === "SUCCESS" && latest.captured !== false),
  };
}

/**
 * True when Cashfree reports the order as successfully paid, AND the paid
 * amount matches what we billed. Used to authorise fulfillment.
 */
export function isPaymentSuccessful(payment: CashfreePayment | null, expectedAmount: number): boolean {
  if (!payment) return false;
  return (
    payment.status === "SUCCESS" &&
    Math.abs(payment.amount - Math.round(expectedAmount * 100) / 100) <= 0.01
  );
}