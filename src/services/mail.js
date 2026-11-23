const nodemailer = require('nodemailer');

const port = Number(process.env.SMTP_PORT || 465);
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`[mail deshabilitado] Para: ${to} | Asunto: ${subject}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('Error enviando mail:', err.message);
    return false;
  }
}

module.exports = { sendMail };
