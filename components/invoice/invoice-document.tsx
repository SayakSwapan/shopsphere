import { formatDate, formatCurrency } from "@/lib/format";
import {
  customizationBilledLetters,
  customizationDesignCharge,
  customizationUnitPrice,
  customizationUnitPriceWithGst,
} from "@/lib/print-pricing";
import type { InvoiceBusiness } from "@/lib/site-settings";

export interface InvoiceItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  variantSku?: string | null;
  variantSize?: string | null;
  variantGender?: string | null;
  mrpSnapshot?: number | string | null;
  gstSnapshot?: number | string | null;
  customization?: {
    printTypeId?: string;
    printTypeName?: string;
    name?: string;
    number?: string;
    imageUrl?: string;
    letters?: number;
    billedLetters?: number;
    pricePerLetter?: number;
    designFee?: number;
    price?: number;
  } | null;
  product: {
    name: string;
    gstPercentage?: number | null;
    isReturnable?: boolean | null;
    isReplaceable?: boolean | null;
    returnDays?: number | null;
  };
}

export interface InvoiceOrder {
  orderNumber: string;
  createdAt: Date | string;
  status: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  totalAmount: number;
  subtotal: number | null;
  gst: number | null;
  shipping: number | null;
  discount: number | null;
  coupon?: { code: string } | null;
  user?: {
    name?: string | null;
    email?: string;
  } | null;
  orderitem: InvoiceItem[];
}

interface Props {
  order: InvoiceOrder;
  business: InvoiceBusiness;
}

const PRIMARY = "var(--t-primary)";
const PRIMARY_TEXT = "color-mix(in srgb, var(--t-primary) 52%, #111827)";
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

/** Indian-system "Rupees ... Only" text for a GST tax invoice. */
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

function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "bg-amber-50 text-amber-700 border-amber-300";
  if (s.includes("deliver") || s.includes("complete")) {
    cls = "bg-emerald-50 text-emerald-700 border-emerald-300";
  } else if (s.includes("ship")) {
    cls = "bg-sky-50 text-sky-700 border-sky-300";
  } else if (
    s.includes("cancel") ||
    s.includes("refund") ||
    s.includes("return")
  ) {
    cls = "bg-rose-50 text-rose-700 border-rose-300";
  }
  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-xs font-black uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={strong ? "font-black text-gray-900" : "text-gray-600"}>
        {label}
      </span>
      <span
        className={
          strong ? "font-black text-gray-900" : "font-semibold text-gray-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

interface PolicyLine {
  text: string;
  positive: boolean;
}

function buildPolicy(order: InvoiceOrder): PolicyLine[] {
  const items = order.orderitem;
  if (!items.length) return [];

  const allReturnable = items.every((i) => i.product.isReturnable);
  const allReplaceable = items.every((i) => i.product.isReplaceable);
  const someReturnable = items.some((i) => i.product.isReturnable);
  const someReplaceable = items.some((i) => i.product.isReplaceable);
  const returnDays = items
    .filter((i) => i.product.isReturnable && i.product.returnDays)
    .reduce(
      (max, i) => Math.max(max, Number(i.product.returnDays) || 0),
      0
    );
  const within = returnDays > 0 ? ` within ${returnDays} days of delivery` : "";

  if (allReturnable && allReplaceable) {
    return [
      {
        text: `All items are eligible for return or replacement${within}.`,
        positive: true,
      },
    ];
  }

  if (allReturnable) {
    return [
      {
        text: `All items are returnable${within}.`,
        positive: true,
      },
    ];
  }

  if (allReplaceable) {
    return [
      {
        text: `All items can be replaced${within}.`,
        positive: true,
      },
    ];
  }

  const lines: PolicyLine[] = [];
  if (someReturnable) {
    lines.push({
      text: `Select items are returnable${within}.`,
      positive: true,
    });
  }
  if (someReplaceable) {
    lines.push({ text: "Select items can be replaced.", positive: true });
  }
  if (!someReturnable && !someReplaceable) {
    lines.push({
      text: "Items are not eligible for return or replacement.",
      positive: false,
    });
  }
  return lines;
}

export default function InvoiceDocument({ order, business }: Props) {
  const subtotalExclGst = Number(order.subtotal) || 0;
  const totalGst = Number(order.gst) || 0;
  const shipping = Number(order.shipping) || 0;
  const discount = Number(order.discount) || 0;

  const itemGstRate = (item: InvoiceItem): number => {
    if (item.price > 0 && item.gstSnapshot != null) {
      return Math.round((Number(item.gstSnapshot) / item.price) * 10000) / 100;
    }
    return Number(item.product.gstPercentage) || 0;
  };

  const subtotalIncl = Math.round((subtotalExclGst + totalGst) * 100) / 100;

  const billingName = order.user?.name || order.fullName;
  const billingEmail = order.user?.email;

  const policy = buildPolicy(order);

  return (
    <div
      className="text-gray-900"
      style={{
        border: `1px solid ${PRIMARY_BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* ── Header band ── */}
      <div style={{ background: "#111827" }} className="px-6 py-4 sm:px-8">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[55%]">
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
                Tax Invoice
              </span>
            </span>
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-base font-black text-white">
                Invoice No: {order.orderNumber}
              </p>
              <p className="text-gray-300">Date: {formatDate(order.createdAt)}</p>
              <StatusChip status={order.status} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Accent strip ── */}
      <div
        style={{
          background: `linear-gradient(90deg, ${PRIMARY}, var(--t-accent))`,
        }}
        className="h-1.5"
      />

      {/* ── Bill To / Ship To ── */}
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
          {billingEmail && <p className="mt-0.5 text-gray-600">{billingEmail}</p>}
          <p className="text-gray-600">{order.phone}</p>
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
            Shipping Address
          </p>
          <p className="font-bold text-gray-900">{order.fullName}</p>
          <p className="text-gray-600">{order.addressLine1}</p>
          {order.addressLine2 && <p className="text-gray-600">{order.addressLine2}</p>}
          <p className="text-gray-600">
            {order.city}, {order.state} {order.pincode}
          </p>
          <p className="text-gray-600">{order.country}</p>
        </div>
      </div>

      {/* ── Items table ── */}
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
              <th className="w-24 px-2 py-2 text-right font-bold">Rate</th>
              <th className="w-16 px-2 py-2 text-center font-bold">GST</th>
              <th className="w-28 px-2 py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.orderitem.map((item, idx) => {
              const gstRate = itemGstRate(item);
              const baseGstPerUnit =
                item.gstSnapshot != null
                  ? Number(item.gstSnapshot)
                  : Math.round(((item.price * gstRate) / 100) * 100) / 100;
              const mrp =
                item.mrpSnapshot != null ? Number(item.mrpSnapshot) : null;
              const hasDiscount = mrp != null && mrp > item.price;
              const variant = [
                item.variantGender,
                item.variantSize && `Size: ${item.variantSize}`,
                item.variantSku && `SKU: ${item.variantSku}`,
              ]
                .filter(Boolean)
                .join(" · ");

              const custom = item.customization;
              const printUnitBase = customizationUnitPrice(custom);
              const designCharge = customizationDesignCharge(custom);
              const printIncl = customizationUnitPriceWithGst(custom, gstRate);
              const pricePerLetter = Number(custom?.pricePerLetter) || 0;
              // Characters actually billed (may exceed typed count via a
              // minimum). Read from the snapshot; fall back to deriving it from
              // the pre-GST letter charge for orders placed before it was stored.
              const billedLetters = customizationBilledLetters(custom, gstRate);
              const printGstPerUnit =
                printUnitBase > 0
                  ? Math.round((printIncl - printUnitBase) * 100) / 100
                  : 0;
              const gstTotal =
                Math.round(
                  (baseGstPerUnit + printGstPerUnit) * item.quantity * 100
                ) / 100;
              const totalIncl = Math.round((item.total + gstTotal) * 100) / 100;
              const unitIncl =
                Math.round((item.price + baseGstPerUnit) * 100) / 100;

              const hasCustom = Boolean(
                custom && (custom.name || custom.number || custom.imageUrl)
              );
              const printDetails = [
                custom?.name && `Name: "${custom.name}"`,
                custom?.number && `No: ${custom.number}`,
                custom?.imageUrl ? "Design image (see attached)" : null,
              ].filter(Boolean);

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
                    <div className="font-bold text-gray-900">
                      {item.product.name}
                      {hasDiscount && (
                        <span className="ml-1.5 text-[11px] font-normal text-gray-400 line-through">
                          MRP {formatCurrency(mrp)}
                        </span>
                      )}
                    </div>
                    {variant && (
                      <div className="text-xs text-gray-500">{variant}</div>
                    )}
                    {hasCustom && (
                      <div
                        className="mt-1 inline-block rounded border px-2 py-1 text-[11px] leading-snug"
                        style={{
                          borderColor: PRIMARY_BORDER,
                          background: PRIMARY_SOFT,
                        }}
                      >
                        <div
                          className="font-black uppercase tracking-wide"
                          style={{ color: PRIMARY_TEXT }}
                        >
                          Custom Print
                          {custom?.printTypeName
                            ? ` (${custom.printTypeName})`
                            : ""}
                        </div>
                        {printDetails.length > 0 && (
                          <div className="text-gray-600">
                            {printDetails.join(" · ")}
                          </div>
                        )}
                        {printIncl > 0 && (
                          <div className="font-semibold text-gray-800">
                            {pricePerLetter > 0 && billedLetters > 0
                              ? `${billedLetters} × ₹${pricePerLetter}/char${designCharge > 0 ? ` + ${formatCurrency(designCharge)} design` : ""} = ${formatCurrency(printIncl)} (incl. GST)`
                              : `${formatCurrency(printIncl)} (incl. GST)`}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-center font-semibold text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-right">
                    <div className="font-semibold text-gray-800">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Incl. GST: {formatCurrency(unitIncl)}
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-center">
                    <div className="font-bold" style={{ color: PRIMARY_TEXT }}>
                      {gstRate > 0 ? `${gstRate}%` : "—"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {baseGstPerUnit > 0 ? formatCurrency(baseGstPerUnit) : "—"}
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-2 py-2 text-right font-bold text-gray-900">
                    {formatCurrency(totalIncl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals + amount in words ── */}
      <div className="mt-4 flex items-start justify-between gap-6 px-6 sm:px-8">
        <div className="max-w-[45%] pt-1 text-sm">
          <p
            className="text-xs font-black uppercase tracking-wider"
            style={{ color: PRIMARY_TEXT }}
          >
            Amount in Words
          </p>
          <p className="mt-1 font-semibold text-gray-800">
            {amountInWords(order.totalAmount)}
          </p>
        </div>
        <div className="w-80 space-y-0.5 text-sm">
          <SummaryRow
            label="Subtotal (Excl. GST)"
            value={formatCurrency(subtotalExclGst)}
          />
          <SummaryRow label="Total GST" value={formatCurrency(totalGst)} />
          <div className="border-t border-gray-200 pt-1">
            <SummaryRow
              label="Subtotal (Incl. GST)"
              value={formatCurrency(subtotalIncl)}
              strong
            />
          </div>
          <SummaryRow
            label="Shipping"
            value={shipping === 0 ? "FREE" : formatCurrency(shipping)}
          />
          {discount > 0 && (
            <SummaryRow
              label={`Coupon${order.coupon?.code ? ` (${order.coupon.code})` : ""}`}
              value={`-${formatCurrency(discount)}`}
            />
          )}
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
              <span className="font-black text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Return / Replacement policy ── */}
      {policy.length > 0 && (
        <div
          className="mx-6 mt-4 rounded-lg border p-3 sm:mx-8"
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
            Return &amp; Replacement Policy
          </p>
          <ul className="space-y-0.5 text-sm">
            {policy.map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                  style={{
                    background: line.positive ? PRIMARY : "var(--t-danger)",
                  }}
                >
                  {line.positive ? "✓" : "✕"}
                </span>
                <span className="text-gray-700">{line.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        className="mt-4 border-t px-6 pb-4 pt-3 sm:px-8"
        style={{ borderColor: PRIMARY_BORDER }}
      >
        {business.notes && (
          <p className="text-xs leading-relaxed text-gray-500">
            {business.notes}
          </p>
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
