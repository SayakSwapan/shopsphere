// Window.Razorpay and RazorpayOptions declared in types/razorpay.d.ts

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      return resolve(false);
    }

    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export interface CustomerDetails {
  name: string;
  email: string;
  contact: string;
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface HandlePaymentArgs {
  initiateOrderBackendUrl: string;

  amount?: number;
  customerDetails?: CustomerDetails;
  payload?: Record<string, unknown>;
  siteName?: string;

  onSuccess?: (
    response: RazorpaySuccess
  ) => void | Promise<void>;
  onDismiss?: () => void;
  onError?: (message: string) => void;
}

export async function handlePayment({
  initiateOrderBackendUrl,
  amount,
  customerDetails,
  payload = {},
  siteName,
  onSuccess,
  onDismiss,
  onError,
}: HandlePaymentArgs): Promise<void> {
  try {
    const loaded = await loadRazorpayScript();

    if (!loaded) {
      throw new Error(
        "Failed to load Razorpay. Check your connection."
      );
    }

    const response = await fetch(
      initiateOrderBackendUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          ...payload,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ?? "Unable to create order"
      );
    }

    const prefill =
      customerDetails ?? data.customer ?? {};

    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: siteName || "ShopSphere",
      description: "Order Payment",
      order_id: data.order.id,

      prefill: {
        name: prefill.name ?? "",
        email: prefill.email ?? "",
        contact: prefill.contact ?? "",
      },

      theme: {
        color: "#F5A623",
      },

      handler: (response: RazorpaySuccess) =>
        onSuccess?.(response),

      modal: {
        ondismiss: () => onDismiss?.(),
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.open();
  } catch (error) {
    onError?.(
      error instanceof Error
        ? error.message
        : "Unable to start payment"
    );
  }
}
