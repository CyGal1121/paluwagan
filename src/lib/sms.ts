// SMS sending utility
// Supports multiple providers: Twilio, Semaphore (popular in Philippines)
// Falls back to console logging in development

export interface SendSmsOptions {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// Normalize Philippine phone numbers
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");

  // Handle Philippine numbers
  if (normalized.startsWith("0")) {
    // Convert 09XX to +639XX
    normalized = "63" + normalized.slice(1);
  } else if (normalized.startsWith("9") && normalized.length === 10) {
    // Convert 9XX to +639XX
    normalized = "63" + normalized;
  } else if (!normalized.startsWith("63") && normalized.length === 10) {
    // Assume it's a Philippine mobile without country code
    normalized = "63" + normalized;
  }

  return "+" + normalized;
}

// Validate Philippine phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Philippine mobile numbers: +639XXXXXXXXX (12 digits total)
  const phMobileRegex = /^\+639\d{9}$/;
  // Also allow international format
  const internationalRegex = /^\+\d{10,15}$/;
  return phMobileRegex.test(normalized) || internationalRegex.test(normalized);
}

export async function sendSms({ to, message }: SendSmsOptions): Promise<SmsResult> {
  const normalizedPhone = normalizePhoneNumber(to);

  // Development mode - just log the SMS
  if (!process.env.SMS_PROVIDER || process.env.NODE_ENV === "development") {
    console.log("[DEV] SMS would be sent:");
    console.log("[DEV] To:", normalizedPhone);
    console.log("[DEV] Message:", message);
    return { success: true, messageId: "dev-" + Date.now() };
  }

  const provider = process.env.SMS_PROVIDER?.toLowerCase();

  try {
    if (provider === "twilio") {
      return await sendViaTwilio(normalizedPhone, message);
    } else if (provider === "semaphore") {
      return await sendViaSemaphore(normalizedPhone, message);
    } else {
      console.warn(`Unknown SMS provider: ${provider}, falling back to dev mode`);
      console.log("[DEV] SMS would be sent:", { to: normalizedPhone, message });
      return { success: true, messageId: "fallback-" + Date.now() };
    }
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: "Failed to send SMS" };
  }
}

async function sendViaTwilio(to: string, message: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return { success: false, error: "SMS service not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Twilio error:", error);
    return { success: false, error: "Failed to send SMS via Twilio" };
  }

  const data = await response.json();
  return { success: true, messageId: data.sid };
}

async function sendViaSemaphore(to: string, message: string): Promise<SmsResult> {
  // Semaphore is a popular SMS provider in the Philippines
  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER_NAME || "Paluwagan";

  if (!apiKey) {
    console.error("Semaphore API key not configured");
    return { success: false, error: "SMS service not configured" };
  }

  // Remove + prefix for Semaphore (they expect 639XXXXXXXXX format)
  const phoneNumber = to.replace("+", "");

  const response = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apikey: apiKey,
      number: phoneNumber,
      message: message,
      sendername: senderName,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Semaphore error:", error);
    return { success: false, error: "Failed to send SMS via Semaphore" };
  }

  const data = await response.json();
  return { success: true, messageId: data[0]?.message_id?.toString() };
}

export function generateInviteSmsMessage({
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
    minimumFractionDigits: 0,
  }).format(contributionAmount);

  return `${inviterName} invited you to join "${branchName}" paluwagan! ${formattedAmount}/${frequency}. Join here: ${inviteUrl}`;
}
