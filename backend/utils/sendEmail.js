import nodemailer from 'nodemailer';

/**
 * Sends an email using SMTP credentials configured in environment variables.
 * Works with Gmail (App Passwords), Mailtrap, SendGrid SMTP, or any SMTP host.
 *
 * @param {Object} options
 * @param {string} options.to - recipient email address
 * @param {string} options.subject - email subject line
 * @param {string} options.html - HTML body content
 * @param {string} [options.text] - plain text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    text: text || 'Please view this email in an HTML-compatible client.',
    html,
  });

  return info;
};

export default sendEmail;
