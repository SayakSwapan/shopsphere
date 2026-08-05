export interface FlowStep {
  status: string;
  title: string;
  description: string;
  phase?: string;
}

// Order fulfilment steps (happy path). CANCELLED is handled separately as a terminal state.
export const ORDER_FLOW_GUIDE: FlowStep[] = [
  {
    status: "PENDING",
    title: "Order Placed",
    description:
      "Customer placed the order. Payment confirmation and order verification are still pending.",
    phase: "Placed",
  },
  {
    status: "CONFIRMED",
    title: "Order Confirmed",
    description: "Order has been verified and confirmed by the team.",
  },
  {
    status: "PAID",
    title: "Payment Received",
    description: "Payment for the order has been received successfully.",
  },
  {
    status: "PACKED",
    title: "Packed",
    description: "Items have been packed securely and are ready for dispatch.",
    phase: "Dispatch",
  },
  {
    status: "SHIPPED",
    title: "Dispatched",
    description:
      "Order handed to the courier and on its way from the warehouse to the customer.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description:
      "Order is with the delivery agent, heading to the customer's shipping address.",
  },
  {
    status: "DELIVERED",
    title: "Delivered",
    description:
      "Order delivered to the customer. This completes the fulfilment journey.",
    phase: "Complete",
  },
];

// COD variant of the order flow. Cash is collected at delivery, so "Payment
// Received" comes after "Delivered" instead of right after confirmation. All
// the same stages, just ordered for how COD money actually moves.
const COD_ORDER_FLOW_GUIDE: FlowStep[] = [
  {
    status: "PENDING",
    title: "Order Placed",
    description:
      "Customer placed the order. Order verification is still pending.",
    phase: "Placed",
  },
  {
    status: "CONFIRMED",
    title: "Order Confirmed",
    description: "Order has been verified and confirmed by the team.",
  },
  {
    status: "PACKED",
    title: "Packed",
    description: "Items have been packed securely and are ready for dispatch.",
    phase: "Dispatch",
  },
  {
    status: "SHIPPED",
    title: "Dispatched",
    description:
      "Order handed to the courier and on its way from the warehouse to the customer.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description:
      "Order is with the delivery agent, heading to the customer's shipping address.",
  },
  {
    status: "DELIVERED",
    title: "Delivered",
    description:
      "Order delivered to the customer. For COD, collect the cash amount at delivery.",
  },
  {
    status: "PAID",
    title: "Payment Received",
    description:
      "Cash collected on delivery has been marked as received. This completes the order.",
    phase: "Complete",
  },
];

export function getOrderFlowGuide(paymentMethod?: string | null): FlowStep[] {
  return paymentMethod === "COD" ? COD_ORDER_FLOW_GUIDE : ORDER_FLOW_GUIDE;
}

// Return request steps.
export const RETURN_FLOW_GUIDE: FlowStep[] = [
  {
    status: "PENDING",
    title: "Request Submitted",
    description:
      "Customer raised a return request with the reason and evidence images.",
    phase: "Request",
  },
  {
    status: "UNDER_REVIEW",
    title: "Under Review",
    description: "Admin reviews the return request and the damage / reason evidence.",
    phase: "Review",
  },
  {
    status: "APPROVED",
    title: "Approved",
    description:
      "Return approved. Courier pickup is scheduled from the order's shipping address. Ask the customer to submit refund bank details (account number, branch, IFSC) from their request page.",
    phase: "Return Pickup",
  },
  {
    status: "PICKUP_SCHEDULED",
    title: "Pickup Scheduled",
    description:
      "Pickup date and the order's shipping address are confirmed with the courier.",
  },
  {
    status: "PICKUP_COMPLETED",
    title: "Product Received",
    description:
      "Returned product has been received and verified by the admin. Ensure the customer's bank details are on file before initiating the refund.",
  },
  {
    status: "REFUND_INITIATED",
    title: "Refund Initiated",
    description:
      "Refund amount and method are confirmed (using the customer's bank details) and processing has started. This is recorded in the refund ledger.",
    phase: "Refund",
  },
  {
    status: "REFUND_COMPLETED",
    title: "Refund Completed",
    description: "Refund issued to the customer's bank account and the return is closed.",
  },
];

// Replacement request steps. The replacement delivery leg mirrors how a
// first-time order is tracked (Dispatched -> Out for Delivery -> Delivered).
export const REPLACEMENT_FLOW_GUIDE: FlowStep[] = [
  {
    status: "PENDING",
    title: "Request Submitted",
    description:
      "Customer raised a replacement request with the reason and evidence images.",
    phase: "Request",
  },
  {
    status: "UNDER_REVIEW",
    title: "Under Review",
    description: "Admin reviews the replacement request and the evidence.",
    phase: "Review",
  },
  {
    status: "APPROVED",
    title: "Approved",
    description:
      "Replacement approved. Pickup of the old item is scheduled from the order's shipping address.",
    phase: "Return Pickup",
  },
  {
    status: "PICKUP_SCHEDULED",
    title: "Pickup Scheduled",
    description:
      "Pickup date and the order's shipping address are confirmed with the courier.",
  },
  {
    status: "PICKUP_COMPLETED",
    title: "Product Received",
    description:
      "Old product received by the admin. Only now can the replacement be dispatched.",
  },
  {
    status: "REPLACEMENT_SHIPPED",
    title: "Replacement Dispatched",
    description:
      "Replacement item dispatched from the warehouse to the customer's shipping address.",
    phase: "Replacement Delivery",
  },
  {
    status: "REPLACEMENT_OUT_FOR_DELIVERY",
    title: "Out for Delivery",
    description:
      "Replacement is with the delivery agent, heading to the customer.",
  },
  {
    status: "REPLACEMENT_DELIVERED",
    title: "Replacement Delivered",
    description: "Replacement delivered to the customer.",
  },
  {
    status: "COMPLETED",
    title: "Completed",
    description: "Replacement request is completed and closed.",
    phase: "Complete",
  },
];
