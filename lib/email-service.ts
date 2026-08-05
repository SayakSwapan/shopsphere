import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { fetchSiteName } from "@/lib/site-settings";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  templateKey: string;
  placeholders: Record<string, string>;
  fallbackSubject?: string;
  fallbackBody?: string;
}

function replacePlaceholders(
  text: string,
  placeholders: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(pattern, value ?? "");
  }
  return result;
}

export async function sendTemplatedEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, templateKey, placeholders, fallbackSubject, fallbackBody } = options;

  const siteName = await fetchSiteName();
  const allPlaceholders = {
    ...placeholders,
    siteName,
    storeName: siteName,
    year: placeholders.year ?? String(new Date().getFullYear()),
  };

  const template = await prisma.emailTemplate.findUnique({
    where: { templateKey },
  });

  if (!template || !template.isActive) {
    if (fallbackSubject && fallbackBody) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: replacePlaceholders(fallbackSubject, allPlaceholders),
        html: replacePlaceholders(fallbackBody, allPlaceholders),
      });
      return true;
    }
    console.error(`Email template "${templateKey}" not found or inactive`);
    return false;
  }

  const subject = replacePlaceholders(template.subject, allPlaceholders);
  const html = replacePlaceholders(template.body, allPlaceholders);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });

  return true;
}
