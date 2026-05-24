const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, type = 'email_verification') => {
  const isReset = type === 'password_reset';
  const subject = isReset ? 'DzidzaAI — Reset Your Password' : 'DzidzaAI — Verify Your Email';
  
  // ALWAYS log OTP in development mode for easier debugging if email fails
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${email} (${type}): ${otp}`);
  }

  try {
    const transporter = createTransporter();
    const heading = isReset ? 'Password Reset Code' : 'Email Verification Code';
    const instruction = isReset
      ? 'You requested a password reset. Use the code below to proceed.'
      : 'Welcome to DzidzaAI! Please verify your email with the code below.';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="margin:0;padding:0;background:#f7f6f2;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e6e0;">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 18px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">DzidzaAI</span>
            </div>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Adaptive Learning Platform</p>
          </div>
          <div style="padding:36px 32px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a2e;font-weight:600;">${heading}</h2>
            <p style="color:#4a4a6a;font-size:14px;line-height:1.6;margin:0 0 28px;">${instruction}</p>
            <div style="background:#f0eff9;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
              <span style="font-size:38px;font-weight:700;letter-spacing:10px;color:#4f46e5;">${otp}</span>
            </div>
            <p style="color:#8888aa;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong>. Never share it with anyone.</p>
            <p style="color:#8888aa;font-size:13px;margin:12px 0 0;">If you did not request this, you can safely ignore this email.</p>
          </div>
          <div style="background:#f7f6f2;padding:16px 32px;border-top:1px solid #e8e6e0;">
            <p style="color:#aaaacc;font-size:12px;margin:0;text-align:center;">© ${new Date().getFullYear()} DzidzaAI · Zimbabwe's Adaptive Learning Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html,
    });
  } catch (err) {
    console.error(`Failed to send email to ${email}: ${err.message}`);
    // If we're in development, don't crash the whole request if email fails
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Could not send verification email. Please check your email settings.');
    }
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f7f6f2;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e6e0;">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:700;">DzidzaAI</span>
          </div>
          <div style="padding:36px 32px;">
            <h2 style="margin:0 0 12px;color:#1a1a2e;">Mhoro, ${name}! 👋</h2>
            <p style="color:#4a4a6a;font-size:15px;line-height:1.7;">Your account is verified and ready. DzidzaAI will now adapt to your learning style, build your study schedule, and guide you towards exam success.</p>
            <div style="background:#f0eff9;border-radius:10px;padding:20px;margin:24px 0;">
              <p style="margin:0;color:#4f46e5;font-size:14px;font-weight:500;">Your first steps:</p>
              <ul style="margin:10px 0 0;padding-left:20px;color:#4a4a6a;font-size:14px;line-height:1.8;">
                <li>Set your subjects and education level</li>
                <li>Upload your school timetable</li>
                <li>Start a chat with your AI tutor</li>
                <li>Take your first adaptive quiz</li>
              </ul>
            </div>
            <p style="color:#8888aa;font-size:13px;">Dzidza — Learn, Grow, Excel.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to DzidzaAI — Your Learning Journey Starts Now',
      html,
    });
  } catch (err) {
    console.error(`Failed to send welcome email to ${email}: ${err.message}`);
  }
};

const sendPasswordChangedEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'DzidzaAI — Password Changed Successfully',
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:32px;border:1px solid #e8e6e0;border-radius:12px;">
        <h2 style="color:#1a1a2e;">Password Updated</h2>
        <p style="color:#4a4a6a;">Hi ${name}, your DzidzaAI password was successfully changed.</p>
        <p style="color:#dc2626;font-size:13px;">If you did not make this change, contact support immediately.</p>
      </div>`,
    });
  } catch (err) {
    console.error(`Failed to send password change email to ${email}: ${err.message}`);
  }
};

module.exports = { generateOTP, sendOTPEmail, sendWelcomeEmail, sendPasswordChangedEmail };
