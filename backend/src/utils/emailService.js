import nodemailer from 'nodemailer';

let transporter;

const isPlaceholder = (value) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'your-email@gmail.com' ||
    normalized === 'your-app-specific-password' ||
    normalized === 'your-16-character-app-password'
  );
};

const getConfiguredAuth = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (smtpUser && smtpPass && !isPlaceholder(smtpUser) && !isPlaceholder(smtpPass)) {
    return { user: smtpUser, pass: smtpPass };
  }

  if (emailUser && emailPass && !isPlaceholder(emailUser) && !isPlaceholder(emailPass)) {
    return { user: emailUser, pass: emailPass };
  }

  return null;
};

const getFromAddress = () => {
  const configuredFrom = process.env.EMAIL_FROM?.trim();
  if (configuredFrom) {
    return configuredFrom;
  }

  const auth = getConfiguredAuth();
  if (auth?.user) {
    return auth.user;
  }

  return process.env.EMAIL_USER;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const auth = getConfiguredAuth();
  if (!auth) {
    throw new Error(
      'Email service is not configured. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS.'
    );
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  if (smtpHost) {
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      auth
    });
  } else {
    // Backward-compatible fallback for existing Gmail setup.
    transporter = nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      auth
    });
  }

  return transporter;
};

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"CreatorConnect" <${getFromAddress()}>`,
    to: email,
    subject: 'Your OTP for CreatorConnect Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">CreatorConnect OTP Verification</h2>
        <p>Your One-Time Password (OTP) for login is:</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 20px; 
                    text-align: center; 
                    font-size: 32px; 
                    letter-spacing: 5px;
                    border-radius: 10px;
                    margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">© 2025 CreatorConnect. All rights reserved.</p>
      </div>
    `
  };

  await getTransporter().sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `"CreatorConnect" <${getFromAddress()}>`,
    to: email,
    subject: 'Welcome to CreatorConnect!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to CreatorConnect, ${name}!</h2>
        <p>We're excited to have you on board. Start connecting with other creators today!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;">
            Get Started
          </a>
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">© 2025 CreatorConnect. All rights reserved.</p>
      </div>
    `
  };

  await getTransporter().sendMail(mailOptions);
};
