import { formatDate, formatCurrency } from "@/lib/format";
import type { InvoiceBusiness } from "@/lib/site-settings";

export interface OfflineInvoiceItem {
  id: string;
  quantity: number;
  /** Pre-GST BASE unit price (what GST is charged on top of). */
  price: number;
  /** GST-INCLUSIVE unit price the customer actually pays. */
  actualSellingPrice: number;
  /** Stored line total (GST-inclusive unit × quantity). */
  total: number;
  gstPercentageAtSale: number | null;
  /** Per-unit GST amount. */
  gstAmountAtSale: number | null;
  variantSku?: string | null;
  variantSize?: string | null;
  variantGender?: string | null;
  product: { name: string };
}

export interface OfflineInvoiceOrder {
  id: string;
  orderNumber: string;
  createdAt: Date | string;
  fullName: string;
  phone: string;
  isWalkIn: boolean;
  offlineEmail?: string | null;
  offlineAddressLine1?: string | null;
  offlineAddressLine2?: string | null;
  offlineCity?: string | null;
  offlineState?: string | null;
  offlinePincode?: string | null;
  totalAmount: number;
  subtotal: number | null;
  gst: number | null;
  paymentMethod: string | null;
  orderitem: OfflineInvoiceItem[];
  user?: { name?: string | null; email?: string | null } | null;
}

// Theme-aware accent colors (same variables the admin / storefront theme uses),
// so the invoice matches the active theme and prints identically.
const PRIMARY = "var(--t-primary)";
const PRIMARY_TEXT = "color-mix(in srgb, var(--t-primary) 52%, #0F172A)";
const PRIMARY_SOFT = "color-mix(in srgb, var(--t-primary) 9%, white)";
const PRIMARY_DEEP = "color-mix(in srgb, var(--t-primary) 16%, white)";
const PRIMARY_BORDER = "color-mix(in srgb, var(--t-primary) 40%, white)";

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const one = n % 10;
  return TENS[Math.floor(n / 10)] + (one ? ` ${ONES[one]}` : "");
}

function threeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/** Indian-system "Rupees ... Only" text for a tax invoice. */
function amountInWords(amount: number): string {
  let rupees = Math.floor(Math.abs(amount));
  let paise = Math.round((Math.abs(amount) - rupees) * 100);
  if (paise === 100) {
    paise = 0;
    rupees += 1;
  }

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  const rupeesText = parts.join(" ") || "Zero";
  const paiseText = paise > 0 ? ` and ${twoDigits(paise)} Paise` : "";
  return `Rupees ${rupeesText}${paiseText} Only`;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Customer-facing invoice for an OFFLINE sale. Shows ONLY store + customer +
 * product/price/GST information — never cost price, last selling price or
 * profit (internal admin figures). Under the offline model the unit price shown
 * is GST-INCLUSIVE (what the customer actually pays).
 */
export default function OfflineInvoice({
  order,
  business,
}: {
  order: OfflineInvoiceOrder;
  business: InvoiceBusiness;
}) {
  const subtotal = Number(order.subtotal) || 0;
  const gst = Number(order.gst) || 0;
  const total = Number(order.totalAmount) || 0;

  const billingName = order.user?.name || order.fullName || "Walk-in Customer";
  const billingEmail = order.offlineEmail || order.user?.email;
  const addressLine1 = order.offlineAddressLine1;
  const addressLine2 = order.offlineAddressLine2;
  const city = order.offlineCity;
  const state = order.offlineState;
  const pincode = order.offlinePincode;
  const paymentLabel = order.paymentMethod
    ? order.paymentMethod.replace(/_/g, " ")
    : "—";

  return (
    <div
      className="invoice-print bg-white text-gray-900"
      id="offline-invoice"
      style={{
        border: `1px solid ${PRIMARY_BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header band */}
      <div style={{ background: "#111827" }} className="px-6 py-4 sm:px-8">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1
              className="text-2xl font-black uppercase tracking-tight"
              style={{ color: PRIMARY }}
            >
              {business.name}
            </h1>
            {business.address && (
              <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-300">
                {business.address}
              </p>
            )}
            <div className="mt-1.5 space-y-0.5 text-xs text-gray-400">
              {business.gstin && (
                <p>
                  GSTIN:{" "}
                  <span className="font-semibold text-gray-100">
                    {business.gstin}
                  </span>
                </p>
              )}
              {business.phone && (
                <p>
                  Phone:{" "}
                  <span className="font-semibold text-gray-100">
                    {business.phone}
                  </span>
                </p>
              )}
              {business.email && (
                <p>
                  Email:{" "}
                  <span className="font-semibold text-gray-100">
                    {business.email}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <span
              className="inline-block rounded-md px-4 py-1.5"
              style={{ background: PRIMARY }}
            >
              <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">
                Offline Invoice
              </span>
            </span>
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-base font-black text-white">
                Invoice No: {order.orderNumber}
              </p>
              <p className="text-gray-300">Date: {formatDate(order.createdAt)}</p>
              <p className="text-gray-300">
                Payment: <span className="font-semibold text-gray-100">{paymentLabel}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accent strip */}
      <div
        style={{ background: `linear-gradient(90deg, ${PRIMARY}, var(--t-accent))` }}
        className="h-1.5"
      />

      {/* Customer */}
      <div className="mt-4 grid grid-cols-2 gap-4 px-6 text-sm sm:px-8">
        <div
          className="rounded-lg border p-3"
          style={{
            background: PRIMARY_SOFT,
            borderColor: PRIMARY_BORDER,
            borderLeft: `3px solid ${PRIMARY}`,
          }}
        >
          <p
            className="mb-1 text-xs font-black uppercase tracking-wider"
            style={{ color: PRIMARY_TEXT }}
          >
            Billed To
          </p>
          <p className="font-bold text-gray-900">{billingName}</p>
          {order.phone && <p className="text-gray-600">{order.phone}</p>}
          {billingEmail && <p className="text-gray-600">{billingEmail}</p>}
        </div>
        <div
          className="rounded-lg border p-3"
          style={{
            background: PRIMARY_SOFT,
            borderColor: PRIMARY_BORDER,
            borderLeft: `3px solid ${PRIMARY}`,
          }}
        >
          <p
            className="mb-1 text-xs font-black uppercase tracking-wider"
            style={{ color: PRIMARY_TEXT }}
          >
            Address
          </p>
          {addressLine1 && <p className="font-semibold text-gray-900">{addressLine1}</p>}
          {addressLine2 && <p className="text-gray-600">{addressLine2}</p>}
          {(city || state || pincode) && (
            <p className="text-gray-600">
              {[city, state, pincode].filter(Boolean).join(", ")}
            </p>
          )}
          {!addressLine1 && !addressLine2 && !city && (
            <p className="text-gray-500">Walk-in customer</p>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="mt-4 px-6 sm:px-8">
        <table
          className="w-full border-collapse text-sm"
          style={{ borderTop: `3px solid ${PRIMARY}` }}
        >
          <thead>
            <tr className="bg-gray-900 text-left text-white">
              <th className="w-8 px-2 py-2 font-bold">#</th>
              <th className="px-2 py-2 font-bold">Item Description</th>
              <th className="w-12 px-2 py-2 text-center font-bold">Qty</th>
              <th className="w-32 px-2 py-2 text-right font-bold">Rate (Incl. GST)</th>
              <th className="w-16 px-2 py-2 text-center font-bold">GST</th>
              <th className="w-28 px-2 py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.orderitem.map((item, idx) => {
              const variant = [item.variantGender, item.variantSize, item.variantSku]
                .filter(Boolean)
                .join(" · ");
              const rateIncl = round2(item.price + (item.gstAmountAtSale ?? 0));
              const gstTotal = round2((item.gstAmountAtSale ?? 0) * item.quantity);
              return (
                <tr
                  key={item.id}
                  className="align-top"
                  style={{
                    background: idx % 2 === 1 ? PRIMARY_SOFT : undefined,
                    breakInside: "avoid",
                  }}
                >
                  <td className="border-b border-gray-100 px-2 py-2 text-xs font-black text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2">
                    <div className="font-bold text-gray-900">{item.product.name}</div>
                    {variant && <div className="text-xs text-gray-500">{variant}</div>}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-center font-semibold text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-right">
                    <div className="font-semibold text-gray-800">{formatCurrency(rateIncl)}</div>
                    <div className="text-[11px] text-gray-500">
                      Base: {formatCurrency(item.price)}
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-center">
                    <div className="font-bold" style={{ color: PRIMARY_TEXT }}>
                      {item.gstPercentageAtSale ? `${item.gstPercentageAtSale}%` : "—"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {gstTotal > 0 ? formatCurrency(gstTotal) : "—"}
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-right font-bold text-gray-900">
                    {formatCurrency(round2(item.price * item.quantity + gstTotal))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals + amount in words */}
      <div className="mt-4 flex items-start justify-between gap-6 px-6 sm:px-8">
        <div className="max-w-[45%] pt-1 text-sm">
          <p
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: PRIMARY_TEXT }}
          >
            Amount in Words
          </p>
          <p className="mt-1 font-semibold text-gray-800">{amountInWords(total)}</p>
        </div>
        <div className="w-80 space-y-0.5 text-sm">
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-600">Subtotal (Excl. GST)</span>
            <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-gray-600">Total GST</span>
            <span className="font-semibold text-gray-800">{formatCurrency(gst)}</span>
          </div>
          <div
            className="mt-1.5 rounded-lg px-4 py-2"
            style={{
              background: PRIMARY_DEEP,
              border: `1px solid ${PRIMARY_BORDER}`,
              borderLeft: `4px solid ${PRIMARY}`,
            }}
          >
            <div className="flex items-center justify-between text-base">
              <span className="font-black" style={{ color: PRIMARY_TEXT }}>
                Total Payable
              </span>
              <span className="font-black text-gray-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-4 border-t px-6 pb-4 pt-3 sm:px-8"
        style={{ borderColor: PRIMARY_BORDER }}
      >
        {business.notes && (
          <p className="text-xs leading-relaxed text-gray-500">{business.notes}</p>
        )}
        <p
          className="mt-1.5 text-center text-xs font-bold"
          style={{ color: PRIMARY_TEXT }}
        >
          Thank you for shopping with {business.name}.
        </p>
      </div>
    </div>
  );
}
