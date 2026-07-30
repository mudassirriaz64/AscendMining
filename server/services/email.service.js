const nodemailer = require('nodemailer');

// Simple helper to check if env config supports SMTP fallback
const getSmtpTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email using Resend (API) or fallback SMTP Transporter
 */
const sendMail = async ({ to, subject, html }) => {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';

  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    // Call Resend's API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Unknown Resend Error' }));
      throw new Error(`Resend API failed: ${err.message}`);
    }
  } else {
    // Fallback/Localhost: Use Nodemailer SMTP
    const transporter = getSmtpTransporter();
    if (!transporter) {
      console.warn(`[Mail service] No email provider configured. Logging email:`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${html}`);
      return;
    }

    const mailOptions = {
      from: `"AscendHash Support" <no-reply@localhost.dev>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email Sent] Preview URL: ${previewUrl}`);
    }
  }
};

/**
 * Send a password reset link to user
 */
const sendResetPasswordEmail = async (email, username, resetLink, otp) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #745b00; margin-bottom: 20px;">Reset Your Password</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset the password for your AscendHash account. Use one of the methods below to reset your password:</p>

      <div style="background: #f8f9ff; border: 1px solid #d1c5ac; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #745b00;">Option 1: Use Reset Code</p>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; letter-spacing: 12px; font-family: monospace; font-weight: 700; color: #0b1c30;">
          ${otp}
        </div>
        <p style="margin: 12px 0 0 0; color: #64748b; font-size: 12px;">Enter this 6-digit code on the password reset page.</p>
      </div>

      <div style="text-align: center; margin: 20px 0; padding: 20px 0; border-top: 1px solid #e2e8f0;">
        <p style="font-weight: 600; color: #745b00; margin-bottom: 16px;">Option 2: Click Reset Link</p>
        <a href="${resetLink}" style="background-color: #F5C518; color: #151b2a; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code and link will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;
  await sendMail({ to: email, subject: 'AscendHash - Reset Password Request', html });
};

module.exports = {
  sendMail,
  sendResetPasswordEmail,
};
