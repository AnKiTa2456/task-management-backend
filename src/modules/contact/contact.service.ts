import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as https from 'https';
import { CreateContactDto } from './dto/create-contact.dto';

// In-memory OTP store: phone → { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  // ── OTP Methods ────────────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) throw new BadRequestException('Invalid phone number');

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(digits, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      this.logger.warn('FAST2SMS_API_KEY not set — OTP generated but not sent via SMS');
      // In dev mode return OTP in response for testing
      return { message: `DEV_OTP:${otp}` };
    }

    await this.sendSms(digits.slice(-10), otp, apiKey);
    this.logger.log(`OTP sent to ${digits.slice(-10)}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ valid: boolean }> {
    const digits = phone.replace(/\D/g, '');
    const record = otpStore.get(digits);

    if (!record) throw new BadRequestException('OTP not found. Please request a new one.');
    if (Date.now() > record.expiresAt) {
      otpStore.delete(digits);
      throw new BadRequestException('OTP expired. Please request a new one.');
    }
    if (record.otp !== otp.trim()) throw new BadRequestException('Invalid OTP.');

    otpStore.delete(digits); // one-time use
    return { valid: true };
  }

  private sendSms(phone: string, otp: string, apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        authorization:    apiKey,
        route:            'q',        // Quick Transactional — no website verification needed
        message:          `Your TaskFlow OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        flash:            '0',
        numbers:          phone,
      });

      const options = {
        hostname: 'www.fast2sms.com',
        path:     `/dev/bulkV2?${params.toString()}`,
        method:   'GET',
        headers:  { 'cache-control': 'no-cache' },
      };

      const req = https.request(options, res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.return === true) resolve();
            else reject(new Error(json.message || 'SMS send failed'));
          } catch {
            reject(new Error('Invalid response from Fast2SMS'));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  // ──────────────────────────────────────────────────────────────────────────

  async handleSubmission(dto: CreateContactDto): Promise<void> {
    this.logger.log(`New contact submission from ${dto.email}`);

    // Try to send email — gracefully fails if SMTP not configured
    try {
      await this.sendEmail(dto);
    } catch (err) {
      this.logger.warn(`Email send failed (SMTP not configured?): ${(err as Error).message}`);
    }
  }

  private async sendEmail(dto: CreateContactDto): Promise<void> {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      this.logger.warn('SMTP_USER / SMTP_PASS not set — skipping email send.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    });

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#4f46e5">📬 New Contact Form Submission — TaskFlow</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px;font-weight:bold;width:130px">Name</td><td style="padding:8px">${dto.name}</td></tr>
          <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${dto.email}">${dto.email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${dto.phone}</td></tr>
        </table>
        <div style="margin-top:20px;background:#f8fafc;border-left:4px solid #4f46e5;padding:16px;border-radius:4px">
          <strong>Message:</strong>
          <p style="margin-top:8px;color:#334155">${dto.message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="margin-top:20px;font-size:12px;color:#94a3b8">
          Sent via TaskFlow contact form · ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    await transporter.sendMail({
      from:    `"TaskFlow Contact" <${smtpUser}>`,
      to:      'p.ankita10101@gmail.com',
      replyTo: dto.email,
      subject: `New Contact: ${dto.name} — ${dto.email}`,
      html,
    });

    this.logger.log(`Contact email sent to p.ankita10101@gmail.com`);
  }
}
