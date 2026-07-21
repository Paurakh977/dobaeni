import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY?.trim();
// DEV_EMAIL_OVERRIDE is only honoured in development to avoid accidental
// email leaks when deploying to production (e.g. Vercel).
const devEmailOverride =
  process.env.NODE_ENV !== 'production'
    ? process.env.DEV_EMAIL_OVERRIDE?.trim()
    : undefined;
const emailFrom =
  process.env.EMAIL_FROM?.trim() || 'Dobaeni <onboarding@resend.dev>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send an email via Resend.
 *
 * In development, if DEV_EMAIL_OVERRIDE is set, the message is redirected to
 * that inbox and the real recipient is shown in the subject. This lets you
 * exercise the full auth email flow (verification, reset, 2FA OTP) with a
 * temporary/dev inbox without sending anything to real users.
 *
 * In production DEV_EMAIL_OVERRIDE is always ignored — emails go to the real
 * recipient using the verified EMAIL_FROM address.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log(`[AUTH EMAIL][NO_PROVIDER] to=${to} subject=${subject}`);
    return;
  }

  const recipient = devEmailOverride ?? to;
  const effectiveSubject = devEmailOverride
    ? `[DEV → ${to}] ${subject}`
    : subject;
  const fromAddress = devEmailOverride
    ? 'Dobaeni <onboarding@resend.dev>'
    : emailFrom;

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: recipient,
    subject: effectiveSubject,
    html,
  });

  if (error) {
    console.error('[Email Error]', {
      name: error.name,
      statusCode: error.statusCode,
      message: error.message,
      subject,
      recipient: recipient.includes('@') ? recipient.split('@')[1] : 'unknown',
    });
    throw error;
  } else if (devEmailOverride) {
    console.log(
      `[Email] Redirected from ${to} → ${recipient} | Subject: ${subject}`,
    );
  }
}
