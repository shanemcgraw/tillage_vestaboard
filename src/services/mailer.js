const sgMail = require('@sendgrid/mail');
const config = require('../config');

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

async function sendAutoReply(toEmail, originalSubject) {
  if (!config.sendgrid.apiKey) {
    console.log('SendGrid not configured, skipping auto-reply');
    return;
  }

  const msg = {
    to: toEmail,
    from: config.sendgrid.fromEmail,
    subject: `Re: ${originalSubject || 'Your message to the board'}`,
    text: `Thanks for your message to the Tillage board!

Your message has been received and is pending review. Once it's approved, it will appear on the board shortly.

- The Tillage board
`,
    html: `<p>Thanks for your message to the Tillage board!</p>
<p>Your message has been received and is pending review. If approved, it will appear on the board shortly.</p>
<p>- The Tillage Team</p>`
  };

  try {
    await sgMail.send(msg);
    console.log(`Auto-reply sent to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send auto-reply:', error.message);
    // Don't throw - auto-reply failure shouldn't break the webhook
  }
}

module.exports = {
  sendAutoReply
};
