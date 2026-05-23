// Resend HTTP API mailer.
// Set RESEND_API_KEY in .env. If unset, codes are logged to the server console
// and returned in the API response as `devCode` so local dev still works.

import { Resend } from 'resend';

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.RESEND_API_KEY) return null;
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function isMailerConfigured() {
  return !!getClient();
}

const SEND_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Email send timed out after ${ms}ms`)), ms);
    promise.then(v => { clearTimeout(t); resolve(v); },
                 e => { clearTimeout(t); reject(e); });
  });
}

export async function sendVerificationEmail(to, firstName, code) {
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px;">
      <h2 style="color:#005bbf; margin-bottom:8px;">Hi ${firstName},</h2>
      <p style="color:#414754;">Your verification code for GED Math Master is:</p>
      <div style="font-size:40px; font-weight:800; letter-spacing:12px; color:#181c20; text-align:center; padding:24px 0;">
        ${code}
      </div>
      <p style="color:#414754; font-size:14px;">
        This code expires in <strong>15 minutes</strong>. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>`;

  const c = getClient();
  if (!c) {
    console.log(`\n[mailer] (dev fallback) Verification code for ${to}: ${code}\n`);
    return { devFallback: true, code };
  }

  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'GED Math Master <noreply@example.com>';

  try {
    const result = await withTimeout(c.emails.send({
      from,
      to,
      subject: 'Verify your GED Math Master account',
      html
    }), SEND_TIMEOUT_MS);

    if (result?.error) {
      console.error('[mailer] Resend returned error:', result.error);
      throw new Error(result.error?.message || 'Resend rejected the email.');
    }
    console.log(`[mailer] sent verification to ${to} (id: ${result?.data?.id || 'unknown'})`);
    return { devFallback: false, id: result?.data?.id };
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    throw err;
  }
}
