import nodemailer from 'nodemailer';
import crypto from 'crypto';
import Otp from '../models/Otp.js';
import User from '../models/User.js';

// ── Nodemailer transporter using Gmail service + App Password ──────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generate a cryptographically random 6-digit OTP string.
 */
const generateOtp = () => {
  return String(crypto.randomInt(100000, 999999));
};

/**
 * Build a premium HTML email template for OTP delivery.
 */
const buildOtpEmail = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your RePair Verification Code</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">RePair</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Specialist Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#1e293b;font-size:22px;font-weight:600;">Verify Your Email Address</h2>
              <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6;">
                Use the 6-digit code below to complete your account setup. This code is valid for <strong>5 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#f8faff;border:2px dashed #c7d2fe;border-radius:12px;padding:28px 20px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#6366f1;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Verification Code</p>
                <span style="font-size:44px;font-weight:700;letter-spacing:12px;color:#1e293b;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email. Do not share this code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} RePair Platform. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * @route   POST /api/auth/send-otp
 * @desc    Generate OTP, save to DB, and send HTML email to the user
 * @access  Public
 * @body    { email: string }
 *
 * Idempotent within a 50-second window: if an OTP was already generated
 * for this email in the last 50 s, we do NOT generate a new one.
 * This prevents React StrictMode's double-invoke from overwriting the OTP
 * that the first email was sent with.
 */
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // ── Idempotency guard ────────────────────────────────────────────────────
    // If an OTP was created in the last 50 seconds, reuse it (don't re-send).
    const existing = await Otp.findOne({ email: normalizedEmail });
    if (existing) {
      const ageSeconds = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;
      if (ageSeconds < 50) {
        return res.status(200).json({
          message: 'OTP already sent. Please check your inbox.',
        });
      }
    }

    // ── Generate and persist a fresh OTP ────────────────────────────────────
    const otp = generateOtp();
    await Otp.findOneAndDelete({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp });

    const mailOptions = {
      from: `"RePair Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your RePair Verification Code',
      html: buildOtpEmail(otp),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully. Please check your inbox.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};


/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify the OTP submitted by the user against the DB record
 * @access  Public
 * @body    { email: string, otp: string }
 */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const record = await Otp.findOne({ email: email.toLowerCase() });

    if (!record) {
      // Either expired (TTL deleted it) or never created
      return res.status(400).json({ message: 'OTP has expired or does not exist. Please request a new one.' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP is valid — clean up the record and mark user as verified
    await Otp.findByIdAndDelete(record._id);
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true }
    );

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};
