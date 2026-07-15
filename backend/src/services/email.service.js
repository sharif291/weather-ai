import nodemailer from 'nodemailer';
import { config } from '../core/config.js';

class EmailService {
  constructor() {
    const { user, pass } = config.email || {};
    this.isActive = Boolean(user && pass);

    if (this.isActive) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass }
      });
    }
  }

  async send(to, subject, text) {
    if (!this.isActive) {
      console.log(`[Email Service] [SIMULATOR] Outbound email to <${to}>: [Subject: ${subject}] - Message: ${text}`);
      return { simulated: true };
    }

    try {
      const mailOptions = {
        from: `"TerraClimate Alerts" <${config.email.user}>`,
        to,
        subject,
        text,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #10b981; margin-bottom: 16px;">🌱 TerraClimate Advisor Alert</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">${text}</p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #edf2f7; font-size: 11px; color: #a0aec0;">
              This is an automated advisory notification generated from weather monitoring parameters. Please adjust settings inside your farm dashboard profile.
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email Service] Sent email alert to <${to}>: MessageId: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`[Email Service] Failed to send email alert to <${to}>:`, err.message);
      throw err;
    }
  }
}

export const emailService = new EmailService();
