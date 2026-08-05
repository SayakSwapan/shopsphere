import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL_TEMPLATES = [
  {
    templateKey: "login_otp",
    templateName: "Login OTP",
    subject: "Your {{siteName}} Login Code: {{otp}}",
    description: "Sent when a user requests an OTP for login",
    placeholders: "{{otp}},{{customerName}},{{expiryMinutes}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Login Verification</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Hello, {{customerName}}</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Use the OTP below to complete your login. This code is valid for <strong style="color:#F5A623;">{{expiryMinutes}} minutes</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0;"><div style="background:rgba(245,166,35,0.08);border:2px dashed #F5A623;border-radius:12px;padding:20px 40px;display:inline-block;"><p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px 0;">Your Login Code</p><p style="color:#F5A623;font-size:36px;font-weight:bold;letter-spacing:10px;margin:0;">{{otp}}</p></div></td></tr></table>
      <p style="color:#8892A4;font-size:13px;line-height:1.6;margin:0 0 20px 0;">If you did not request this code, you can safely ignore this email.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">This OTP was sent to <strong style="color:#ffffff;">{{email}}</strong>. Never share this code with anyone.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "forgot_password_otp",
    templateName: "Forgot Password OTP",
    subject: "{{siteName}} — Password Reset Request",
    description: "Sent when a user requests a password reset",
    placeholders: "{{customerName}},{{otp}},{{expiryMinutes}},{{email}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Password Reset</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Hello, {{customerName}}</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">We received a request to reset the password for your {{siteName}} account. Use the OTP below to proceed. This code is valid for <strong style="color:#F5A623;">{{expiryMinutes}} minutes</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0;"><div style="background:rgba(245,166,35,0.08);border:2px dashed #F5A623;border-radius:12px;padding:20px 40px;display:inline-block;"><p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px 0;">Your Reset Code</p><p style="color:#F5A623;font-size:36px;font-weight:bold;letter-spacing:10px;margin:0;">{{otp}}</p></div></td></tr></table>
      <p style="color:#8892A4;font-size:13px;line-height:1.6;margin:0 0 20px 0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">For security, this OTP was sent to <strong style="color:#ffffff;">{{email}}</strong>. Never share this code with anyone.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "email_verification",
    templateName: "Email Verification",
    subject: "Verify Your {{siteName}} Email Address",
    description: "Sent to verify a newly registered customer's email",
    placeholders: "{{customerName}},{{otp}},{{expiryMinutes}},{{email}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Email Verification</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Welcome, {{customerName}}!</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Thank you for creating your {{siteName}} account. Please verify your email address using the OTP below. This code is valid for <strong style="color:#F5A623;">{{expiryMinutes}} minutes</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0;"><div style="background:rgba(245,166,35,0.08);border:2px dashed #F5A623;border-radius:12px;padding:20px 40px;display:inline-block;"><p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px 0;">Your Verification Code</p><p style="color:#F5A623;font-size:36px;font-weight:bold;letter-spacing:10px;margin:0;">{{otp}}</p></div></td></tr></table>
      <p style="color:#8892A4;font-size:13px;line-height:1.6;margin:0 0 20px 0;">Once verified, you'll be able to log in and start shopping. If you didn't create this account, please ignore this email.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">This verification code was sent to <strong style="color:#ffffff;">{{email}}</strong>. Never share this code with anyone.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "welcome_email",
    templateName: "Welcome Email",
    subject: "Welcome to {{siteName}}, {{customerName}}!",
    description: "Sent after successful email verification",
    placeholders: "{{customerName}},{{email}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Welcome Aboard</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Hello, {{customerName}}!</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Your email has been verified and your account is now fully active. You're ready to explore the latest trends in fashion, footwear, accessories, and lifestyle products.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;"><a href="https://shopsphere.com" style="display:inline-block;background:#F5A623;color:#0A0F1E;font-weight:bold;font-size:14px;padding:14px 40px;border-radius:12px;text-decoration:none;">Start Shopping</a></td></tr></table>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:24px 0 0 0;">As a welcome gift, enjoy <strong style="color:#F5A623;">10% off</strong> your first order with code <strong style="color:#F5A623;">WELCOME10</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">If you have any questions, reply to this email or contact us at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "password_reset_success",
    templateName: "Password Reset Success",
    subject: "Your {{siteName}} Password Has Been Changed",
    description: "Sent after a successful password reset",
    placeholders: "{{customerName}},{{email}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Security Alert</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Password Changed</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Hello {{customerName}}, the password for your {{siteName}} account has been successfully changed. If this was you, no further action is needed.</p>
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#EF4444;font-size:14px;font-weight:bold;margin:0 0 6px 0;">Didn't change your password?</p>
        <p style="color:#8892A4;font-size:13px;margin:0;">If you did not make this change, please contact our support team immediately at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">This notification was sent to <strong style="color:#ffffff;">{{email}}</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "order_confirmation",
    templateName: "Order Confirmation",
    subject: "Order Confirmed — #{{orderNumber}}",
    description: "Sent after a customer places an order",
    placeholders: "{{customerName}},{{orderNumber}},{{orderTotal}},{{orderStatus}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Order Confirmed</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Thank you, {{customerName}}!</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Your order has been placed successfully. We'll notify you when it ships.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,166,35,0.06);border:1px solid rgba(245,166,35,0.15);border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Order Number</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#F5A623;font-size:14px;font-weight:bold;margin:0;">#{{orderNumber}}</p></td></tr>
            <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Order Total</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0;">{{orderTotal}}</p></td></tr>
            <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Status</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#34D399;font-size:14px;font-weight:bold;margin:0;">{{orderStatus}}</p></td></tr>
          </table>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;"><a href="https://shopsphere.com/account/orders" style="display:inline-block;background:#F5A623;color:#0A0F1E;font-weight:bold;font-size:14px;padding:14px 40px;border-radius:12px;text-decoration:none;">Track Your Order</a></td></tr></table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">Questions? Contact us at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "order_shipped",
    templateName: "Order Shipped",
    subject: "Your Order #{{orderNumber}} Has Shipped!",
    description: "Sent when an order is shipped",
    placeholders: "{{customerName}},{{orderNumber}},{{trackingNumber}},{{trackingLink}},{{orderTotal}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Shipment Update</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Your order is on the way!</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Hi {{customerName}}, great news! Your order #{{orderNumber}} has been shipped and is on its way to you.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.15);border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Order Number</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#F5A623;font-size:14px;font-weight:bold;margin:0;">#{{orderNumber}}</p></td></tr>
            <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Tracking Number</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0;">{{trackingNumber}}</p></td></tr>
          </table>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;"><a href="{{trackingLink}}" style="display:inline-block;background:#F5A623;color:#0A0F1E;font-weight:bold;font-size:14px;padding:14px 40px;border-radius:12px;text-decoration:none;">Track Shipment</a></td></tr></table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">Estimated delivery within 5-7 business days. Questions? Contact us at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "order_delivered",
    templateName: "Order Delivered",
    subject: "Your Order #{{orderNumber}} Has Been Delivered",
    description: "Sent when an order is delivered",
    placeholders: "{{customerName}},{{orderNumber}},{{orderTotal}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Delivery Confirmed</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Delivered!</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Hi {{customerName}}, your order #{{orderNumber}} has been delivered. We hope you love your purchase!</p>
      <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <p style="color:#34D399;font-size:16px;font-weight:bold;margin:0 0 6px 0;">Package Delivered</p>
        <p style="color:#8892A4;font-size:13px;margin:0;">Order #{{orderNumber}} &bull; {{orderTotal}}</p>
      </div>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 24px 0;">We'd love to hear your feedback. Rate your experience and help other shoppers make informed decisions.</p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;"><a href="https://shopsphere.com/account/orders" style="display:inline-block;background:#F5A623;color:#0A0F1E;font-weight:bold;font-size:14px;padding:14px 40px;border-radius:12px;text-decoration:none;">Write a Review</a></td></tr></table>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">Need help? Contact us at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "order_cancelled",
    templateName: "Order Cancelled",
    subject: "Order #{{orderNumber}} Has Been Cancelled",
    description: "Sent when an order is cancelled",
    placeholders: "{{customerName}},{{orderNumber}},{{cancelReason}},{{orderTotal}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Order Cancelled</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Order Cancelled</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Hi {{customerName}}, your order #{{orderNumber}} has been cancelled as requested.</p>
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Order Number</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0;">#{{orderNumber}}</p></td></tr>
          <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Order Total</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0;">{{orderTotal}}</p></td></tr>
          <tr><td style="padding:6px 0;"><p style="color:#8892A4;font-size:13px;margin:0;">Reason</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#EF4444;font-size:14px;font-weight:bold;margin:0;">{{cancelReason}}</p></td></tr>
        </table>
      </div>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 24px 0;">If a payment was made, your refund will be processed within 5-7 business days. We're sorry to see you go and hope to serve you again.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">Questions? Contact us at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
  },
  {
    templateKey: "refund_processed",
    templateName: "Refund Processed",
    subject: "Refund Confirmed for Order #{{orderNumber}}",
    description: "Sent when a refund is processed",
    placeholders: "{{customerName}},{{orderNumber}},{{refundAmount}},{{refundId}}",
    body: `<div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td><h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">{{siteName}}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:36px 32px;">
      <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Refund Processed</p>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Refund Confirmed</h2>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Hi {{customerName}}, your refund for order #{{orderNumber}} has been processed successfully.</p>
      <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
        <p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;">Refund Amount</p>
        <p style="color:#34D399;font-size:32px;font-weight:bold;margin:0 0 8px 0;">{{refundAmount}}</p>
        <p style="color:#8892A4;font-size:13px;margin:0;">Refund ID: <strong style="color:#ffffff;">{{refundId}}</strong></p>
      </div>
      <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 24px 0;">The refund will be credited to your original payment method within 5-7 business days, depending on your bank or payment provider.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.06);margin-top:24px;"><tr><td style="padding-top:24px;"><p style="color:#8892A4;font-size:12px;margin:0;">Questions? Contact us at <strong style="color:#F5A623;">support@shopsphere.com</strong>.</p></td></tr></table>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr><td align="center"><p style="color:#3A4455;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr></table>
</div>`,
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
