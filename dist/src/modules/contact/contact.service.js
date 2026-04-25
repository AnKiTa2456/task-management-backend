"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ContactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
const https = require("https");
const otpStore = new Map();
let ContactService = ContactService_1 = class ContactService {
    constructor() {
        this.logger = new common_1.Logger(ContactService_1.name);
    }
    async sendOtp(phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10)
            throw new common_1.BadRequestException('Invalid phone number');
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        otpStore.set(digits, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
        const apiKey = process.env.FAST2SMS_API_KEY;
        if (!apiKey) {
            this.logger.warn('FAST2SMS_API_KEY not set — OTP generated but not sent via SMS');
            return { message: `DEV_OTP:${otp}` };
        }
        await this.sendSms(digits.slice(-10), otp, apiKey);
        this.logger.log(`OTP sent to ${digits.slice(-10)}`);
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(phone, otp) {
        const digits = phone.replace(/\D/g, '');
        const record = otpStore.get(digits);
        if (!record)
            throw new common_1.BadRequestException('OTP not found. Please request a new one.');
        if (Date.now() > record.expiresAt) {
            otpStore.delete(digits);
            throw new common_1.BadRequestException('OTP expired. Please request a new one.');
        }
        if (record.otp !== otp.trim())
            throw new common_1.BadRequestException('Invalid OTP.');
        otpStore.delete(digits);
        return { valid: true };
    }
    sendSms(phone, otp, apiKey) {
        return new Promise((resolve, reject) => {
            const params = new URLSearchParams({
                authorization: apiKey,
                route: 'q',
                message: `Your TaskFlow OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
                flash: '0',
                numbers: phone,
            });
            const options = {
                hostname: 'www.fast2sms.com',
                path: `/dev/bulkV2?${params.toString()}`,
                method: 'GET',
                headers: { 'cache-control': 'no-cache' },
            };
            const req = https.request(options, res => {
                let body = '';
                res.on('data', chunk => (body += chunk));
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (json.return === true)
                            resolve();
                        else
                            reject(new Error(json.message || 'SMS send failed'));
                    }
                    catch {
                        reject(new Error('Invalid response from Fast2SMS'));
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }
    async handleSubmission(dto) {
        this.logger.log(`New contact submission from ${dto.email}`);
        try {
            await this.sendEmail(dto);
        }
        catch (err) {
            this.logger.warn(`Email send failed (SMTP not configured?): ${err.message}`);
        }
    }
    async sendEmail(dto) {
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
            from: `"TaskFlow Contact" <${smtpUser}>`,
            to: 'p.ankita10101@gmail.com',
            replyTo: dto.email,
            subject: `New Contact: ${dto.name} — ${dto.email}`,
            html,
        });
        this.logger.log(`Contact email sent to p.ankita10101@gmail.com`);
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = ContactService_1 = __decorate([
    (0, common_1.Injectable)()
], ContactService);
//# sourceMappingURL=contact.service.js.map