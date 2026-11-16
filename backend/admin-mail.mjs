import nodemailer from 'nodemailer';

let transport;
export async function sendAdminInvitation(email) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_ORIGIN } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !APP_ORIGIN) throw new Error('Invitation email is not configured');
  transport ||= nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT || 465), secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
    logger: false, debug: false
  });
  await transport.sendMail({
    from: { name: 'RAQVOI', address: SMTP_FROM }, to: email,
    subject: 'Your invitation to RAQVOI Admin',
    text: `You have been invited to join RAQVOI as an Admin.\n\nSign in to your store account using this email address:\n${APP_ORIGIN}/#/account\n\nThen select Set up Admin access, create your Admin password and connect Google Authenticator. Your invitation expires in 7 days.\n\nIf you were not expecting this invitation, you can ignore it.`,
    disableFileAccess: true, disableUrlAccess: true
  });
}
