import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null; // dev fallback
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

export function isMailerConfigured() {
  return !!getTransporter();
}

export async function sendVerificationEmail(to, firstName, code) {
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; padding: 32px;">
      <h2 style="color:#005bbf; margin-bottom:8px;">Hi ${firstName} 👋</h2>
      <p style="color:#414754;">Your verification code for GED Math Master is:</p>
      <div style="font-size:40px; font-weight:800; letter-spacing:12px; color:#181c20; text-align:center; padding:24px 0;">
        ${code}
      </div>
      <p style="color:#414754; font-size:14px;">
        This code expires in <strong>15 minutes</strong>. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>`;

  const t = getTransporter();
  if (!t) {
    // Dev fallback — no SMTP configured. Log the code so it's testable locally.
    console.log(`\n[mailer] (dev fallback) Verification code for ${to}: ${code}\n`);
    return { devFallback: true, code };
  }

  const from = process.env.SMTP_FROM || `"GED Math Master" <noreply@example.com>`;
  await t.sendMail({
    from,
    to,
    subject: 'Verify your GED Math Master account',
    html
  });
  return { devFallback: false };
}
