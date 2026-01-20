const sgMail = require('@sendgrid/mail');
const config = require('../config');

if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

function generateVestaboardPreviewHtml(vestaboardText) {
  const lines = vestaboardText.split('\n');

  // Generate the 6x22 grid as HTML
  let gridHtml = '';
  for (let row = 0; row < 6; row++) {
    const line = lines[row] || ' '.repeat(22);
    let rowHtml = '';
    for (let col = 0; col < 22; col++) {
      const char = line[col] || ' ';
      const displayChar = char === ' ' ? '&nbsp;' : char;
      rowHtml += `<td style="width: 24px; height: 32px; background-color: #1a1a1a; color: #ffffff; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #333; border-radius: 2px;">${displayChar}</td>`;
    }
    gridHtml += `<tr>${rowHtml}</tr>`;
  }

  return `
    <table cellpadding="0" cellspacing="2" style="background-color: #0d0d0d; padding: 12px; border-radius: 8px; border: 2px solid #333;">
      ${gridHtml}
    </table>
  `;
}

function generatePlainTextPreview(vestaboardText) {
  const lines = vestaboardText.split('\n');
  const border = '+' + '-'.repeat(24) + '+';
  let preview = border + '\n';
  for (const line of lines) {
    preview += '| ' + line + ' |\n';
  }
  preview += border;
  return preview;
}

async function sendAutoReply(toEmail, originalSubject, vestaboardText) {
  if (!config.sendgrid.apiKey) {
    console.log('SendGrid not configured, skipping auto-reply');
    return;
  }

  const previewHtml = generateVestaboardPreviewHtml(vestaboardText);
  const previewText = generatePlainTextPreview(vestaboardText);

  const msg = {
    to: toEmail,
    from: config.sendgrid.fromEmail,
    subject: `Re: ${originalSubject || 'Your message to the board'}`,
    text: `Thanks for your message to the Tillage board!

Your message has been received and is pending review. Here's how it will appear on the board:

${previewText}

BOARD SPECS:
- 6 rows x 22 characters per row (132 characters max)
- Supported: A-Z, 0-9, and: ! @ # $ % ( ) + - & = ; : ' " , . / ? °
- Messages longer than 132 characters will be truncated with "..."

If your message looks different than expected, try shortening it or removing unsupported characters.

- The Tillage board
`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Thanks for your message!</h2>
    <p style="color: #555; line-height: 1.6;">Your message has been received and is pending review. Here's a preview of how it will appear on the board:</p>

    <div style="text-align: center; margin: 24px 0; overflow-x: auto;">
      ${previewHtml}
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0; font-size: 14px;">BOARD SPECS</h3>
      <ul style="color: #666; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>6 rows x 22 characters</strong> per row (132 characters max)</li>
        <li><strong>Supported characters:</strong> A-Z, 0-9, and: ! @ # $ % ( ) + - & = ; : ' " , . / ? °</li>
        <li>Messages longer than 132 characters will be <strong>truncated with "..."</strong></li>
      </ul>
    </div>

    <p style="color: #888; font-size: 13px; font-style: italic;">If your message looks different than expected, try shortening it or removing unsupported characters.</p>

    <p style="color: #555; margin-bottom: 0;">- Tillage board</p>
  </div>
</body>
</html>
`
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
