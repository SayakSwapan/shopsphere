import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { fetchSiteName } from "@/lib/site-settings";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function replacePlaceholders(text: string, placeholders: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return result;
}

async function sendFromTemplate(
  templateKey: string,
  to: string,
  placeholders: Record<string, string>,
  fallbackSubject: string,
  fallbackBody: string
): Promise<boolean> {
  try {
    const siteName = await fetchSiteName();
    const allPlaceholders = {
      ...placeholders,
      siteName,
      storeName: siteName,
      year: String(new Date().getFullYear()),
    };

    const template = await prisma.emailTemplate.findUnique({
      where: { templateKey },
    });

    if (template && template.isActive) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: replacePlaceholders(template.subject, allPlaceholders),
        html: replacePlaceholders(template.body, allPlaceholders),
      });
      return true;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: replacePlaceholders(fallbackSubject, allPlaceholders),
      html: replacePlaceholders(fallbackBody, allPlaceholders),
    });
    return true;
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
    `<div style="background:#0A0F1E;color:white;padding:40px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Your OTP is:</p><h2 style="letter-spacing:8px;color:#F5A623;">${otp}</h2><p>Valid for 10 minutes.</p></div>`
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
    `<div style="background:#0A0F1E;color:white;padding:48px 40px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Hello ${name},</p><p>Your password reset OTP is:</p><h2 style="letter-spacing:8px;color:#F5A623;">${otp}</h2><p>Valid for 10 minutes.</p></div>`
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
    const siteName = await fetchSiteName();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `${siteName} — Re: ${subject}`,
    html: `
      <div style="background:#0A0F1E;color:#ffffff;padding:48px 40px;font-family:Arial,Helvetica,sans-serif;">
        <h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">${siteName}</h1>
        <p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p>
        <div style="background:#111827;border-radius:16px;padding:36px 32px;">
          <p style="color:#8892A4;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin:0 0 12px 0;">Support Reply</p>
          <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px 0;">Hello, ${customerName}</h2>
          <p style="color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 28px 0;">Thank you for reaching out to us. Our support team has reviewed your message and here is our response.</p>
          <div style="margin-bottom:24px;">
            <p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;">Your Message</p>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;">
              <p style="color:#F5A623;font-size:12px;font-weight:bold;margin:0 0 6px 0;">Subject: ${subject}</p>
              <p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${customerMessage}</p>
            </div>
          </div>
          <div style="margin-bottom:24px;">
            <p style="color:#8892A4;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 8px 0;">Our Reply</p>
            <div style="background:rgba(245,166,35,0.06);border:1px solid rgba(245,166,35,0.15);border-radius:12px;padding:20px;">
              <p style="color:#CBD5E1;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${adminReply}</p>
            </div>
          </div>
        </div>
        <p style="color:#3A4455;font-size:11px;margin-top:32px;text-align:center;">&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    `,
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
    `<div style="background:#0A0F1E;color:white;padding:48px 40px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Hello ${name},</p><p>Your password has been successfully changed.</p></div>`
  );
}
