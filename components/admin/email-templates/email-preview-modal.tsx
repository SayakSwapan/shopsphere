"use client";

import { useState } from "react";
import { X, Monitor, Smartphone, Eye } from "lucide-react";

/** Realistic sample values for every placeholder the system supports. */
const SAMPLE: Record<string, string> = {
  "{{customerName}}": "Rahul Sharma",
  "{{name}}": "Rahul Sharma",
  "{{otp}}": "482916",
  "{{email}}": "rahul@example.com",
  "{{verificationLink}}": "https://trinovasports.com/verify?token=abc123",
  "{{resetPasswordLink}}": "https://trinovasports.com/reset?token=xyz789",
  "{{expiryMinutes}}": "10",
  "{{orderNumber}}": "TS-2026-1042",
  "{{orderTotal}}": "\u20B92,499",
  "{{orderStatus}}": "Shipped",
  "{{trackingNumber}}": "TRK9876543210",
  "{{trackingLink}}": "https://trinovasports.com/track/TRK9876543210",
  "{{refundAmount}}": "\u20B9899",
  "{{refundId}}": "RF-2026-0042",
  "{{productName}}": "Pro Training Jersey",
  "{{productPrice}}": "\u20B91,299",
  "{{cancelReason}}": "Out of stock",
  "{{shopName}}": "Trinova Sports",
  "{{siteName}}": "Trinova Sports",
  "{{supportEmail}}": "support@trinovasports.com",
  "{{year}}": "2026",
  "{{siteLogo}}": "",
  "{{logoBlock}}":
    '<h1 style="color:#111827;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.5px;">Trinova Sports</h1>',
};

function replacePlaceholders(html: string): string {
  let out = html;
  for (const [ph, val] of Object.entries(SAMPLE)) {
    // Double-brace {{key}}
    out = out.replaceAll(ph, val);
  }
  return out;
}

interface Props {
  subject: string;
  body: string;
  open: boolean;
  onClose: () => void;
}

export default function EmailPreviewModal({ subject, body, open, onClose }: Props) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  if (!open) return null;

  const resolvedSubject = replacePlaceholders(subject);
  const resolvedBody = replacePlaceholders(body);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${resolvedSubject}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #E5E7EB; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; }
    a { word-break: break-word; }
  </style>
</head>
<body>
${resolvedBody}
</body>
</html>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close preview"
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Eye size={18} className="shrink-0 text-amber-400" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">Email Preview</p>
              <p className="text-xs text-slate-400 truncate">Subject: {resolvedSubject}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport toggle */}
            <div className="flex rounded-lg border border-slate-600 bg-[#0F172A] p-0.5">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewport === "desktop"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor size={13} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewport === "mobile"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone size={13} /> Mobile
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Iframe body */}
        <div className="flex-1 overflow-auto bg-slate-800 p-4">
          <div className="mx-auto" style={{ maxWidth: viewport === "mobile" ? 375 : 680 }}>
            {/* Phone frame chrome */}
            {viewport === "mobile" && (
              <div className="mx-auto mb-2 flex items-center justify-center gap-1.5 rounded-t-xl border border-b-0 border-slate-600 bg-[#0F172A] px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-slate-600" />
                <div className="h-2 w-2 rounded-full bg-slate-600" />
                <div className="h-2 w-2 rounded-full bg-slate-600" />
              </div>
            )}
            <iframe
              title="Email preview"
              srcDoc={fullHtml}
              sandbox="allow-same-origin"
              className={`w-full border bg-white ${
                viewport === "mobile"
                  ? "rounded-b-xl border-slate-600"
                  : "rounded-xl border-slate-600"
              }`}
              style={{
                height: viewport === "mobile" ? 720 : 640,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
