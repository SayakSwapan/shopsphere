import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Light, table-based transactional email design.
//
// Rationale: the old dark-navy + amber theme rendered inconsistently across
// clients — Outlook (Windows) and several webmails force light backgrounds,
// which made white-on-dark text unreadable. Everything below uses solid hex
// colors (no `rgba()`), inline styles and table-based layout so the same email
// looks correct in Gmail, Outlook, Apple Mail and mobile clients.
//
// The `.body` of every template is a self-contained HTML email (DB-stored, so
// admins can edit). Builders below guarantee a consistent header/card/footer.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_BG = "#F2F4F8";
const CARD_BORDER = "#E5E9F0";
const INK = "#111827";
const BODY_TEXT = "#4B5563";
const MUTED = "#6B7280";
const FAINT = "#9AA4B2";
const ACCENT = "#B45309";
const BAND = "#F59E0B";
const BTN_BG = "#111827";
const BTN_TEXT = "#FFFFFF";
const DIVIDER = "#EDF0F5";
const SOFT_BG = "#F8FAFC";
const SUCCESS_TEXT = "#059669";
const SUCCESS_BG = "#ECFDF5";
const SUCCESS_BORDER = "#A7F3D0";
const DANGER_TEXT = "#DC2626";
const DANGER_BG = "#FEF2F2";
const DANGER_BORDER = "#FECACA";
const WARNING_BG = "#FFFBEB";
const WARNING_BORDER = "#FDE68A";

/**
 * Full-page wrapper: light canvas, top brand band, centered logo block, white
 * content card and a centered footer. `{{logoBlock}}` is injected at send time.
 */
function emailShell(inner: string, footerSupport: string): string {
  return `<div style="background:${PAGE_BG};padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
        <tr><td style="background:${BAND};height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
        <tr><td align="center" style="background:#FFFFFF;border-left:1px solid ${CARD_BORDER};border-right:1px solid ${CARD_BORDER};padding:32px 32px 24px 32px;">{{logoBlock}}</td></tr>
        <tr><td style="background:#FFFFFF;border-left:1px solid ${CARD_BORDER};border-right:1px solid ${CARD_BORDER};border-bottom:1px solid ${CARD_BORDER};border-radius:0 0 16px 16px;padding:0 32px 36px 32px;">${inner}</td></tr>
        <tr><td align="center" style="padding:24px 16px 0 16px;">
          ${footerSupport ? `<p style="color:${MUTED};font-size:12px;line-height:1.6;margin:0 0 6px 0;">${footerSupport}</p>` : ""}
          <p style="color:${FAINT};font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`;
}

/** Kicker eyebrow + heading + intro paragraph. */
function headingBlock(label: string, heading: string, text: string): string {
  return `<p style="color:${ACCENT};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">${label}</p>
<h2 style="color:${INK};font-size:22px;font-weight:800;margin:0 0 8px 0;line-height:1.35;">${heading}</h2>
<p style="color:${BODY_TEXT};font-size:14px;line-height:1.7;margin:0 0 24px 0;">${text}</p>`;
}

/** Bulletproof numbered-code panel (solid colors, readable in every client). */
function otpCode(label: string, code: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:4px 0 24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:${SOFT_BG};border:1px solid ${CARD_BORDER};border-radius:12px;">
      <tr><td align="center" style="padding:20px 32px;">
        <p style="color:${FAINT};font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px 0;">${label}</p>
        <p style="color:${INK};font-size:32px;font-weight:800;letter-spacing:8px;margin:0;text-align:center;">${code}</p>
      </td></tr>
    </table>
  </td></tr></table>`;
}

/** Bulletproof CTA button (`bgcolor` on a `td` renders in Outlook). */
function ctaButton(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:8px 0 24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${BTN_BG}" style="border-radius:12px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 40px;color:${BTN_TEXT};font-size:14px;font-weight:bold;text-decoration:none;border-radius:12px;">${label}</a>
    </td></tr></table>
  </td></tr></table>`;
}

/** Label/value row inside an info box. */
function kvRow(label: string, value: string, valueColor = INK, strong = false): string {
  return `<tr><td style="padding:6px 0;"><p style="color:${MUTED};font-size:13px;margin:0;">${label}</p></td><td align="right" style="padding:6px 0;"><p style="color:${valueColor};font-size:14px;font-weight:${strong ? "bold" : "normal"};margin:0;">${value}</p></td></tr>`;
}

const INFO_BOX_STYLES: Record<string, string> = {
  default: `background:${SOFT_BG};border:1px solid ${CARD_BORDER};`,
  success: `background:${SUCCESS_BG};border:1px solid ${SUCCESS_BORDER};`,
  danger: `background:${DANGER_BG};border:1px solid ${DANGER_BORDER};`,
  warning: `background:${WARNING_BG};border:1px solid ${WARNING_BORDER};`,
};

function infoBox(inner: string, variant: keyof typeof INFO_BOX_STYLES = "default", align = "left"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${INFO_BOX_STYLES[variant]}border-radius:12px;margin:0 0 24px 0;"><tr><td style="padding:20px 24px;text-align:${align};">${inner}</td></tr></table>`;
}

/** Uppercase section label above a block (order summary, shipping, etc.). */
function sectionLabel(label: string): string {
  return `<p style="color:${FAINT};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:28px 0 10px 0;">${label}</p>`;
}

/** Muted footnote separated by a top hairline (OTP recipients, confirmations). */
function noteLine(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${DIVIDER};margin-top:24px;"><tr><td style="padding-top:20px;"><p style="color:${MUTED};font-size:12px;line-height:1.6;margin:0;">${content}</p></td></tr></table>`;
}

const SUPPORT = "Questions? Contact us at <a href=\"mailto:{{supportEmail}}\" style=\"color:" + ACCENT + ";text-decoration:underline;\">{{supportEmail}}</a>.";

const EMAIL_TEMPLATES = [
  {
    templateKey: "login_otp",
    templateName: "Login OTP",
    subject: "Your {{siteName}} Login Code: {{otp}}",
    description: "Sent when a user requests an OTP for login",
    placeholders: "{{otp}},{{customerName}},{{expiryMinutes}},{{email}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Login Verification",
        "Hello, {{customerName}}",
        "Use the code below to complete your login. This code is valid for <strong style=\"color:" + INK + ";\">{{expiryMinutes}} minutes</strong>."
      ) +
        otpCode("Your Login Code", "{{otp}}") +
        noteLine("This OTP was sent to <strong style=\"color:" + INK + ";\">{{email}}</strong>. Never share this code with anyone."),
      "If you did not request this code, you can safely ignore this email."
    ),
  },
  {
    templateKey: "forgot_password_otp",
    templateName: "Forgot Password OTP",
    subject: "{{siteName}} — Password Reset Request",
    description: "Sent when a user requests a password reset",
    placeholders: "{{customerName}},{{otp}},{{expiryMinutes}},{{email}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Password Reset",
        "Hello, {{customerName}}",
        "We received a request to reset the password for your {{siteName}} account. Use the code below to proceed. This code is valid for <strong style=\"color:" + INK + ";\">{{expiryMinutes}} minutes</strong>."
      ) +
        otpCode("Your Reset Code", "{{otp}}") +
        noteLine("For security, this OTP was sent to <strong style=\"color:" + INK + ";\">{{email}}</strong>. Never share this code with anyone."),
      "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged."
    ),
  },
  {
    templateKey: "email_verification",
    templateName: "Email Verification",
    subject: "Verify Your {{siteName}} Email Address",
    description: "Sent to verify a newly registered customer's email",
    placeholders: "{{customerName}},{{otp}},{{expiryMinutes}},{{email}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Email Verification",
        "Welcome, {{customerName}}!",
        "Thank you for creating your {{siteName}} account. Please verify your email address using the code below. This code is valid for <strong style=\"color:" + INK + ";\">{{expiryMinutes}} minutes</strong>."
      ) +
        otpCode("Your Verification Code", "{{otp}}") +
        noteLine("This verification code was sent to <strong style=\"color:" + INK + ";\">{{email}}</strong>. Never share this code with anyone."),
      "If you didn't create this account, please ignore this email."
    ),
  },
  {
    templateKey: "welcome_email",
    templateName: "Welcome Email",
    subject: "Welcome to {{siteName}}, {{customerName}}!",
    description: "Sent after successful email verification",
    placeholders: "{{customerName}},{{email}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Welcome Aboard",
        "Hello, {{customerName}}!",
        "Your email has been verified and your account is now fully active. You&apos;re ready to explore the latest trends in fashion, footwear, accessories, and lifestyle products."
      ) +
        infoBox(
          '<p style="color:' +
            MUTED +
            ';font-size:13px;margin:0 0 6px 0;">As a welcome gift, enjoy <strong style="color:' +
            INK +
            ';">10% off</strong> your first order with code</p><p style="color:' +
            ACCENT +
            ';font-size:24px;font-weight:800;letter-spacing:4px;margin:0;text-align:center;">WELCOME10</p>',
          "warning",
          "center"
        ) +
        ctaButton("https://shopsphere.com", "Start Shopping") +
        noteLine("Need help? " + SUPPORT),
      SUPPORT
    ),
  },
  {
    templateKey: "password_reset_success",
    templateName: "Password Reset Success",
    subject: "Your {{siteName}} Password Has Been Changed",
    description: "Sent after a successful password reset",
    placeholders: "{{customerName}},{{email}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Security Alert",
        "Password Changed",
        "Hello {{customerName}}, the password for your {{siteName}} account has been successfully changed. If this was you, no further action is needed."
      ) +
        infoBox(
          '<p style="color:' +
            DANGER_TEXT +
            ';font-size:14px;font-weight:bold;margin:0 0 6px 0;">Didn&apos;t change your password?</p><p style="color:' +
            MUTED +
            ';font-size:13px;line-height:1.6;margin:0;">If you did not make this change, please contact our support team immediately at <a href="mailto:{{supportEmail}}" style="color:' +
            ACCENT +
            ';text-decoration:underline;">{{supportEmail}}</a>.</p>',
          "danger"
        ) +
        noteLine("This notification was sent to <strong style=\"color:" + INK + ";\">{{email}}</strong>."),
      SUPPORT
    ),
  },
  {
    templateKey: "order_confirmation",
    templateName: "Order Confirmation",
    subject: "Order Confirmed — #{{orderNumber}}",
    description: "Sent after a customer places an order",
    placeholders: "{{customerName}},{{orderNumber}},{{orderTotal}},{{orderStatus}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Order Confirmed",
        "Thank you, {{customerName}}!",
        "Your order has been placed successfully. We&apos;ll notify you when it ships."
      ) +
        infoBox(
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            kvRow("Order Number", "#{{orderNumber}}", ACCENT, true) +
            kvRow("Order Total", "{{orderTotal}}", INK, true) +
            kvRow("Status", "{{orderStatus}}", SUCCESS_TEXT, true) +
            "</table>",
          "success"
        ) +
        ctaButton("https://shopsphere.com/account/orders", "Track Your Order") +
        noteLine(SUPPORT),
      SUPPORT
    ),
  },
  {
    templateKey: "order_confirmation_paid",
    templateName: "Order Confirmation (Paid)",
    subject: "Order #{{orderNumber}} confirmed — payment received",
    description: "Sent to the customer after an online payment is confirmed",
    placeholders: "{{customerName}},{{orderNumber}},{{orderDate}},{{paymentMethod}},{{paymentStatus}},{{itemsTable}},{{subtotal}},{{gst}},{{shipping}},{{discount}},{{total}},{{shippingName}},{{shippingAddress}},{{shippingPhone}},{{customerEmail}},{{messageHeadline}},{{messageBody}},{{supportEmail}},{{logoBlock}}",
    body: emailShell(
      headingBlock("Payment Received", "Hello, {{customerName}}", "{{messageBody}}") +
        infoBox(
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            kvRow("Order Number", "#{{orderNumber}}", ACCENT, true) +
            kvRow("Order Date", "{{orderDate}}") +
            kvRow("Payment", "{{paymentMethod}}") +
            kvRow("Payment Status", "{{paymentStatus}}", SUCCESS_TEXT, true) +
            kvRow("Order Total", "{{total}}", INK, true) +
            "</table>",
          "success"
        ) +
        sectionLabel("Order Summary") +
        "{{itemsTable}}" +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">' +
        kvRow("Subtotal (excl. GST)", "{{subtotal}}") +
        kvRow("GST", "{{gst}}") +
        kvRow("Shipping", "{{shipping}}") +
        kvRow("Discount", "{{discount}}", SUCCESS_TEXT) +
        '<tr><td style="padding:10px 0 6px 0;border-top:1px solid ' +
        DIVIDER +
        ';"><p style="color:' +
        INK +
        ';font-size:16px;font-weight:bold;margin:0;">Total</p></td><td align="right" style="padding:10px 0 6px 0;border-top:1px solid ' +
        DIVIDER +
        ';"><p style="color:' +
        ACCENT +
        ';font-size:18px;font-weight:800;margin:0;">{{total}}</p></td></tr>' +
        "</table>" +
        sectionLabel("Shipping To") +
        '<p style="color:' +
        INK +
        ';font-size:14px;font-weight:bold;line-height:1.6;margin:0 0 4px 0;">{{shippingName}}</p>' +
        '<p style="color:' +
        MUTED +
        ';font-size:13px;line-height:1.7;margin:0;">{{shippingAddress}}</p>' +
        '<p style="color:' +
        MUTED +
        ';font-size:13px;line-height:1.7;margin:4px 0 0 0;">Phone: {{shippingPhone}}</p>' +
        noteLine("This confirmation was sent to <strong style=\"color:" + INK + ";\">{{customerEmail}}</strong>."),
      SUPPORT
    ),
  },
  {
    templateKey: "order_confirmation_cod",
    templateName: "Order Confirmation (COD)",
    subject: "Order #{{orderNumber}} confirmed",
    description: "Sent to the customer right after a Cash-on-Delivery order is placed",
    placeholders: "{{customerName}},{{orderNumber}},{{orderDate}},{{paymentMethod}},{{paymentStatus}},{{itemsTable}},{{subtotal}},{{gst}},{{shipping}},{{discount}},{{total}},{{shippingName}},{{shippingAddress}},{{shippingPhone}},{{customerEmail}},{{messageHeadline}},{{messageBody}},{{supportEmail}},{{logoBlock}}",
    body: emailShell(
      headingBlock("Order Confirmed", "Hello, {{customerName}}", "{{messageBody}}") +
        infoBox(
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            kvRow("Order Number", "#{{orderNumber}}", ACCENT, true) +
            kvRow("Order Date", "{{orderDate}}") +
            kvRow("Payment", "{{paymentMethod}}") +
            kvRow("Payment Status", "{{paymentStatus}}", ACCENT, true) +
            kvRow("Total Payable on Delivery", "{{total}}", INK, true) +
            "</table>",
          "warning"
        ) +
        sectionLabel("Order Summary") +
        "{{itemsTable}}" +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">' +
        kvRow("Subtotal (excl. GST)", "{{subtotal}}") +
        kvRow("GST", "{{gst}}") +
        kvRow("Shipping", "{{shipping}}") +
        kvRow("Discount", "{{discount}}", SUCCESS_TEXT) +
        '<tr><td style="padding:10px 0 6px 0;border-top:1px solid ' +
        DIVIDER +
        ';"><p style="color:' +
        INK +
        ';font-size:16px;font-weight:bold;margin:0;">Total</p></td><td align="right" style="padding:10px 0 6px 0;border-top:1px solid ' +
        DIVIDER +
        ';"><p style="color:' +
        ACCENT +
        ';font-size:18px;font-weight:800;margin:0;">{{total}}</p></td></tr>' +
        "</table>" +
        sectionLabel("Shipping To") +
        '<p style="color:' +
        INK +
        ';font-size:14px;font-weight:bold;line-height:1.6;margin:0 0 4px 0;">{{shippingName}}</p>' +
        '<p style="color:' +
        MUTED +
        ';font-size:13px;line-height:1.7;margin:0;">{{shippingAddress}}</p>' +
        '<p style="color:' +
        MUTED +
        ';font-size:13px;line-height:1.7;margin:4px 0 0 0;">Phone: {{shippingPhone}}</p>' +
        noteLine("Please keep <strong style=\"color:" + ACCENT + ";\">{{total}}</strong> ready in cash when the delivery partner arrives. This confirmation was sent to <strong style=\"color:" + INK + ";\">{{customerEmail}}</strong>."),
      SUPPORT
    ),
  },
  {
    templateKey: "order_shipped",
    templateName: "Order Shipped",
    subject: "Your Order #{{orderNumber}} Has Shipped!",
    description: "Sent when an order is shipped",
    placeholders: "{{customerName}},{{orderNumber}},{{trackingNumber}},{{trackingLink}},{{orderTotal}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Shipment Update",
        "Your order is on the way!",
        "Hi {{customerName}}, great news! Your order #{{orderNumber}} has been shipped and is on its way to you."
      ) +
        infoBox(
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            kvRow("Order Number", "#{{orderNumber}}", ACCENT, true) +
            kvRow("Order Total", "{{orderTotal}}", INK, true) +
            kvRow("Tracking Number", "{{trackingNumber}}", INK, true) +
            "</table>",
          "success"
        ) +
        ctaButton("{{trackingLink}}", "Track Shipment") +
        noteLine("Estimated delivery within 5-7 business days. " + SUPPORT),
      SUPPORT
    ),
  },
  {
    templateKey: "order_delivered",
    templateName: "Order Delivered",
    subject: "Your Order #{{orderNumber}} Has Been Delivered",
    description: "Sent when an order is delivered",
    placeholders: "{{customerName}},{{orderNumber}},{{orderTotal}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Delivery Confirmed",
        "Delivered!",
        "Hi {{customerName}}, your order #{{orderNumber}} has been delivered. We hope you love your purchase!"
      ) +
        infoBox(
          '<p style="color:' +
            SUCCESS_TEXT +
            ';font-size:16px;font-weight:bold;margin:0 0 4px 0;">Package Delivered</p><p style="color:' +
            MUTED +
            ';font-size:13px;margin:0;">Order #{{orderNumber}} &bull; {{orderTotal}}</p>',
          "success",
          "center"
        ) +
        '<p style="color:' +
        BODY_TEXT +
        ';font-size:14px;line-height:1.7;margin:0 0 8px 0;">We&apos;d love to hear your feedback. Rate your experience and help other shoppers make informed decisions.</p>' +
        ctaButton("https://shopsphere.com/account/orders", "Write a Review") +
        noteLine(SUPPORT),
      SUPPORT
    ),
  },
  {
    templateKey: "order_cancelled",
    templateName: "Order Cancelled",
    subject: "Order #{{orderNumber}} Has Been Cancelled",
    description: "Sent when an order is cancelled",
    placeholders: "{{customerName}},{{orderNumber}},{{cancelReason}},{{orderTotal}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Order Cancelled",
        "Order Cancelled",
        "Hi {{customerName}}, your order #{{orderNumber}} has been cancelled as requested."
      ) +
        infoBox(
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            kvRow("Order Number", "#{{orderNumber}}", INK, true) +
            kvRow("Order Total", "{{orderTotal}}", INK, true) +
            kvRow("Reason", "{{cancelReason}}", DANGER_TEXT, true) +
            "</table>",
          "danger"
        ) +
        '<p style="color:' +
        BODY_TEXT +
        ';font-size:14px;line-height:1.7;margin:0 0 24px 0;">If a payment was made, your refund will be processed within 5-7 business days. We' +
        "&apos;re sorry to see you go and hope to serve you again.</p>" +
        noteLine(SUPPORT),
      SUPPORT
    ),
  },
  {
    templateKey: "refund_processed",
    templateName: "Refund Processed",
    subject: "Refund Confirmed for Order #{{orderNumber}}",
    description: "Sent when a refund is processed",
    placeholders: "{{customerName}},{{orderNumber}},{{refundAmount}},{{refundId}},{{logoBlock}},{{supportEmail}}",
    body: emailShell(
      headingBlock(
        "Refund Processed",
        "Refund Confirmed",
        "Hi {{customerName}}, your refund for order #{{orderNumber}} has been processed successfully."
      ) +
        infoBox(
          '<p style="color:' +
            FAINT +
            ';font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;">Refund Amount</p><p style="color:' +
            SUCCESS_TEXT +
            ';font-size:32px;font-weight:800;margin:0 0 8px 0;">{{refundAmount}}</p><p style="color:' +
            MUTED +
            ';font-size:13px;margin:0;">Refund ID: <strong style="color:' +
            INK +
            ';">{{refundId}}</strong></p>',
          "success",
          "center"
        ) +
        '<p style="color:' +
        BODY_TEXT +
        ';font-size:14px;line-height:1.7;margin:0 0 24px 0;">The refund will be credited to your original payment method within 5-7 business days, depending on your bank or payment provider.</p>' +
        noteLine(SUPPORT),
      SUPPORT
    ),
  },
];

async function main() {
  console.log("Seeding email templates...");

  for (const template of EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { templateKey: template.templateKey },
      update: {
        templateName: template.templateName,
        subject: template.subject,
        body: template.body,
        description: template.description,
        placeholders: template.placeholders,
      },
      create: {
        templateKey: template.templateKey,
        templateName: template.templateName,
        subject: template.subject,
        body: template.body,
        description: template.description,
        placeholders: template.placeholders,
        isActive: true,
      },
    });
  }

  console.log(`${EMAIL_TEMPLATES.length} email templates seeded.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });