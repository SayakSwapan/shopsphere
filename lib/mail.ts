import {
  emailTransporter,
  escapeEmailHtml,
  resolveEmailFrom,
  sendTemplatedEmail,
} from "@/lib/email-service";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

/**
 * Shared light email shell for the inline fallbacks (used only when an
 * EmailTemplate row is missing or disabled). Matches the seeded template
 * design in prisma/seed-email-templates.ts.
 */
function fallbackShell(inner: string, footer = ""): string {
  return `<div style="background:#F2F4F8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
      <tr><td style="background:#F59E0B;height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
      <tr><td align="center" style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;padding:32px 32px 24px 32px;"><h1 style="color:#111827;font-size:28px;font-weight:800;margin:0;">{{siteName}}</h1></td></tr>
      <tr><td style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;border-bottom:1px solid #E5E9F0;border-radius:0 0 16px 16px;padding:0 32px 36px 32px;">${inner}</td></tr>
      <tr><td align="center" style="padding:24px 16px 0 16px;">
        ${footer ? `<p style="color:#6B7280;font-size:12px;line-height:1.6;margin:0 0 6px 0;">${footer}</p>` : ""}
        <p style="color:#9AA4B2;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr></table>
</div>`;
}

/** Numbered-code panel used by the OTP fallbacks. */
function otpChip(otp: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:4px 0 24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E5E9F0;border-radius:12px;">
      <tr><td align="center" style="padding:20px 32px;">
        <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 8px 0;">${label}</p>
        <p style="color:#111827;font-size:32px;font-weight:800;letter-spacing:8px;margin:0;">${escapeEmailHtml(otp)}</p>
      </td></tr>
    </table>
  </td></tr></table>`;
}

async function sendFromTemplate(
  templateKey: string,
  to: string,
  placeholders: Record<string, string>,
  fallbackSubject: string,
  fallbackBody: string
): Promise<boolean> {
  try {
    return await sendTemplatedEmail({
      to,
      templateKey,
      placeholders,
      fallbackSubject,
      fallbackBody,
    });
  } catch (error) {
    console.error(`Failed to send email (${templateKey}):`, error);
    return false;
  }
}

export async function sendOtpEmail(email: string, otp: string) {
  await sendFromTemplate(
    "login_otp",
    email,
    {
      otp,
      email,
      customerName: "Customer",
      expiryMinutes: "10",
      year: String(new Date().getFullYear()),
    },
    "{{siteName}} Verification OTP",
    fallbackShell(
      `<p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">Use the code below to complete your login. This code is valid for <strong>{{expiryMinutes}} minutes</strong>.</p>` +
        otpChip(otp, "Your Login Code") +
        `<p style="color:#6B7280;font-size:12px;line-height:1.6;margin:0;">If you did not request this code, you can safely ignore this email.</p>`
    )
  );
}

export async function sendPasswordResetEmail(email: string, otp: string, userName: string | null) {
  const name = userName || "Customer";
  await sendFromTemplate(
    "forgot_password_otp",
    email,
    {
      otp,
      email,
      customerName: name,
      expiryMinutes: "10",
      year: String(new Date().getFullYear()),
    },
    "{{siteName}} — Password Reset Request",
    fallbackShell(
      `<p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">Hello ${escapeEmailHtml(name)}, we received a request to reset the password for your {{siteName}} account. Use the code below to proceed. This code is valid for <strong>{{expiryMinutes}} minutes</strong>.</p>` +
        otpChip(otp, "Your Reset Code") +
        `<p style="color:#6B7280;font-size:12px;line-height:1.6;margin:0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>`
    )
  );
}

export async function sendContactReplyEmail(
  toEmail: string,
  customerName: string,
  subject: string,
  customerMessage: string,
  adminReply: string
) {
  try {
    const siteName = await getSiteName(await getSiteSettings());
    await emailTransporter.sendMail({
      from: await resolveEmailFrom(),
      to: toEmail,
      subject: `${siteName} — Re: ${subject}`,
      html: `<div style="background:#F2F4F8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
      <tr><td style="background:#F59E0B;height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
      <tr><td align="center" style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;padding:32px 32px 24px 32px;"><h1 style="color:#111827;font-size:28px;font-weight:800;margin:0;">${escapeEmailHtml(siteName)}</h1></td></tr>
      <tr><td style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;border-bottom:1px solid #E5E9F0;border-radius:0 0 16px 16px;padding:0 32px 36px 32px;">
        <p style="color:#B45309;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Support Reply</p>
        <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px 0;">Hello, ${escapeEmailHtml(customerName)}</h2>
        <p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">Thank you for reaching out to us. Our support team has reviewed your message and here is our response.</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E5E9F0;border-radius:12px;margin:0 0 16px 0;"><tr><td style="padding:20px 24px;">
          <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Your Message</p>
          <p style="color:#B45309;font-size:12px;font-weight:bold;margin:0 0 6px 0;">Subject: ${escapeEmailHtml(subject)}</p>
          <p style="color:#4B5563;font-size:13px;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeEmailHtml(customerMessage)}</p>
        </td></tr></table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin:0;"><tr><td style="padding:20px 24px;">
          <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Our Reply</p>
          <p style="color:#111827;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeEmailHtml(adminReply)}</p>
        </td></tr></table>
      </td></tr>
      <tr><td align="center" style="padding:24px 16px 0 16px;"><p style="color:#6B7280;font-size:12px;line-height:1.6;margin:0 0 6px 0;">Questions? Reply to this email.</p><p style="color:#9AA4B2;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} ${escapeEmailHtml(siteName)}. All rights reserved.</p></td></tr>
    </table>
  </td></tr></table>
</div>`,
    });
  } catch (error) {
    console.error("Failed to send contact reply email:", error);
  }
}

export async function sendPasswordResetSuccessEmail(email: string, userName: string | null) {
  const name = userName || "Customer";
  await sendFromTemplate(
    "password_reset_success",
    email,
    {
      email,
      customerName: name,
      year: String(new Date().getFullYear()),
    },
    "Your {{siteName}} Password Has Been Changed",
    fallbackShell(
      `<p style="color:#B45309;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Security Alert</p>` +
        `<h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px 0;">Password Changed</h2>` +
        `<p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">Hello ${escapeEmailHtml(name)}, the password for your {{siteName}} account has been successfully changed. If this was you, no further action is needed.</p>` +
        `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;"><tr><td style="padding:20px 24px;"><p style="color:#DC2626;font-size:14px;font-weight:bold;margin:0 0 6px 0;">Didn&apos;t change your password?</p><p style="color:#4B5563;font-size:13px;line-height:1.6;margin:0;">If you did not make this change, please contact our support team immediately at <strong style="color:#B45309;">{{supportEmail}}</strong>.</p></td></tr></table>`,
      "Questions? Contact us at {{supportEmail}}."
    )
  );
}