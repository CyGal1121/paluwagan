import { Resend } from "resend";

// Initialize Resend with API key
// For development, emails will be logged if RESEND_API_KEY is not set
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Pinoy Paluwagan <noreply@pinoypaluwagan.com>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // In development without API key, just log
  if (!resend) {
    console.log("[DEV] Email would be sent:", { to, subject });
    console.log("[DEV] HTML:", html);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send exception:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export function generateInviteEmailHtml({
  inviterName,
  branchName,
  contributionAmount,
  frequency,
  inviteUrl,
}: {
  inviterName: string;
  branchName: string;
  contributionAmount: number;
  frequency: string;
  inviteUrl: string;
}): string {
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(contributionAmount);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join a Paluwagan!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Pinoy Paluwagan</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You're Invited!</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">
      <strong>${inviterName}</strong> has invited you to join their paluwagan branch!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111;">${branchName}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Contribution:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Frequency:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${frequency}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Join This Branch
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      This invitation link will expire in 7 days. If you have any questions, contact ${inviterName} directly.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">Pinoy Paluwagan - Rotating Savings Made Easy</p>
    <p style="margin: 5px 0 0 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>
`;
}

export function generateInviteEmailText({
  inviterName,
  branchName,
  contributionAmount,
  frequency,
  inviteUrl,
}: {
  inviterName: string;
  branchName: string;
  contributionAmount: number;
  frequency: string;
  inviteUrl: string;
}): string {
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(contributionAmount);

  return `
You're Invited to Join a Paluwagan!

${inviterName} has invited you to join their paluwagan branch!

Branch: ${branchName}
Contribution: ${formattedAmount}
Frequency: ${frequency}

Join this branch: ${inviteUrl}

This invitation link will expire in 7 days.

---
Pinoy Paluwagan - Rotating Savings Made Easy
If you didn't expect this invitation, you can safely ignore this email.
`.trim();
}
