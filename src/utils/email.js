import nodemailer from 'nodemailer';
import { env, logger } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

export async function sendResetEmail(to, resetToken) {
  const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`;
  try {
    await transporter.sendMail({
      from: env.email.from,
      to,
      subject: 'Password Reset - PMS',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Password Reset</h2>
          <p style="color: #475569;">You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 24px; background: #3b82f6; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
        </div>
      `,
    });
    logger.info(`Password reset email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send reset email to ${to}: ${error.message}`);
  }
}

export async function sendNotificationEmail(to, subject, html) {
  try {
    await transporter.sendMail({ from: env.email.from, to, subject, html });
    logger.info(`Notification email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send notification email to ${to}: ${error.message}`);
  }
}
