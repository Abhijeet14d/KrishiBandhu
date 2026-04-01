const nodemailer = require('nodemailer');

const emailPort = Number(process.env.EMAIL_PORT || 587);
const emailSecure = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === 'true'
  : emailPort === 465;

// Create transporter with retry-friendly and production-safe defaults.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000
});

let transporterVerified = false;
let lastVerifyAttempt = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryEmailError = (error) => {
  const retryableCodes = ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EAI_AGAIN', 'EMFILE'];
  if (retryableCodes.includes(error?.code)) return true;

  const statusCode = Number(error?.responseCode);
  return [421, 425, 429, 450, 451, 452].includes(statusCode);
};

const ensureTransporterVerified = async () => {
  const now = Date.now();
  if (transporterVerified || now - lastVerifyAttempt < 60_000) {
    return;
  }

  lastVerifyAttempt = now;
  await transporter.verify();
  transporterVerified = true;
};

const sendMailWithRetry = async (mailOptions, retries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await ensureTransporterVerified();
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      transporterVerified = false;

      if (attempt === retries || !shouldRetryEmailError(error)) {
        throw error;
      }

      await wait(500 * (attempt + 1));
    }
  }

  throw lastError;
};

// Send OTP email
const sendOTPEmail = async (email, name, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Farmer Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; border: 2px dashed #10b981; }
            .otp { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Farmer Assistant</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with Farmer Assistant! To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <div class="otp">${otp}</div>
              </div>
              
              <p><strong>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES} minutes.</strong></p>
              <p>If you didn't request this verification, please ignore this email.</p>
              
              <div class="footer">
                <p>© 2025 Farmer Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMailWithRetry(mailOptions);
    console.log(`✉️ OTP email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset email
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Farmer Assistant" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .btn:hover { background: #059669; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Farmer Assistant</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your password for your Farmer Assistant account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ This link will expire in 1 hour.</strong>
                <p style="margin: 5px 0 0 0;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #10b981;">${resetUrl}</p>
              
              <div class="footer">
                <p>© 2025 Farmer Assistant. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMailWithRetry(mailOptions);
    console.log(`✉️ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };
