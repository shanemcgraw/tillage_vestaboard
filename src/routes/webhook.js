const express = require('express');
const multer = require('multer');
const prisma = require('../db');
const { cleanEmailBody, parseEmailAddress, extractPlainText } = require('../services/email-parser');
const { transformForVestaboard } = require('../services/text-transform');
const { sendAutoReply } = require('../services/mailer');

const router = express.Router();
const upload = multer();

// POST /webhook/email - SendGrid Inbound Parse webhook
router.post('/email', upload.none(), async (req, res) => {
  try {
    const {
      from,
      subject,
      text,
      html,
      headers
    } = req.body;

    console.log('Received email webhook:', { from, subject });

    // Parse sender
    const sender = parseEmailAddress(from);

    // Extract message ID for deduplication
    let messageId = null;
    if (headers) {
      try {
        const headerLines = headers.split('\n');
        const msgIdLine = headerLines.find(h => h.toLowerCase().startsWith('message-id:'));
        if (msgIdLine) {
          messageId = msgIdLine.split(':').slice(1).join(':').trim();
        }
      } catch (e) {
        // Ignore header parsing errors
      }
    }

    // Extract and clean body
    const rawBody = extractPlainText(text, html);
    const cleanedBody = cleanEmailBody(rawBody);
    const vestaboardText = transformForVestaboard(cleanedBody);

    // Insert message (with deduplication via messageId)
    let created = false;
    try {
      await prisma.message.create({
        data: {
          senderEmail: sender.email,
          senderName: sender.name,
          subject,
          rawBody,
          cleanedBody,
          vestaboardText,
          messageId
        }
      });
      created = true;
    } catch (err) {
      // Unique constraint violation means duplicate - ignore
      if (err.code !== 'P2002') {
        throw err;
      }
    }

    // Only send auto-reply if this is a new message (not a duplicate)
    if (created && sender.email) {
      await sendAutoReply(sender.email, subject, vestaboardText);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries on our errors
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

module.exports = router;
