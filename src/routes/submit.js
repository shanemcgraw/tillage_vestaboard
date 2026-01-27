const express = require('express');
const prisma = require('../db');
const { transformForVestaboard } = require('../services/text-transform');

const router = express.Router();

// GET /submit - Public submission form
router.get('/', (req, res) => {
  res.render('submit', {
    error: null,
    formData: { name: '', email: '', message: '' }
  });
});

// POST /submit - Handle form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, vestaboard_text, website } = req.body;

    // Honeypot check - if 'website' field is filled, it's likely a bot
    if (website && website.trim() !== '') {
      // Silently accept but don't process (bots think it worked)
      return res.render('submit-success', {
        senderName: name
      });
    }

    // Server-side validation
    const errors = [];

    if (!name || !name.trim()) {
      errors.push('Name is required');
    }

    if (!email || !email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }

    if (!vestaboard_text || !vestaboard_text.trim()) {
      errors.push('Message is required');
    }

    if (errors.length > 0) {
      return res.render('submit', {
        error: errors.join('. '),
        formData: { name, email, message: vestaboard_text }
      });
    }

    // Transform the message for Vestaboard format
    const cleanedBody = vestaboard_text.trim();
    const vestaboardFormatted = transformForVestaboard(cleanedBody);

    // Create pending message record
    await prisma.message.create({
      data: {
        senderEmail: email.trim(),
        senderName: name.trim(),
        subject: 'Web Submission',
        rawBody: cleanedBody,
        cleanedBody: cleanedBody,
        vestaboardText: vestaboardFormatted,
        status: 'pending'
      }
    });

    // Render success page (no email sent per requirements)
    res.render('submit-success', {
      senderName: name.trim()
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.render('submit', {
      error: 'Something went wrong. Please try again.',
      formData: { name: req.body.name, email: req.body.email, message: req.body.vestaboard_text }
    });
  }
});

module.exports = router;
