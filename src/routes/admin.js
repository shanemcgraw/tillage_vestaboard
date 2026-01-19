const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const { postToVestaboard } = require('../services/vestaboard');

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

// GET /admin - Dashboard
router.get('/', async (req, res) => {
  try {
    // Get pending messages
    const pending = await prisma.message.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        senderEmail: true,
        senderName: true,
        subject: true,
        cleanedBody: true,
        createdAt: true
      }
    });

    // Get recent history (last 20)
    const history = await prisma.message.findMany({
      where: { status: { not: 'pending' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        senderEmail: true,
        senderName: true,
        subject: true,
        status: true,
        createdAt: true,
        postedAt: true
      }
    });

    res.render('dashboard', { pending, history });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Database error');
  }
});

// GET /admin/compose - Compose new message
router.get('/compose', (req, res) => {
  res.render('compose');
});

// POST /admin/compose - Post composed message
router.post('/compose', async (req, res) => {
  try {
    const { vestaboard_text } = req.body;

    if (!vestaboard_text || !vestaboard_text.trim()) {
      req.session.flash = { type: 'error', message: 'Message cannot be empty' };
      return res.redirect('/admin/compose');
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        senderEmail: 'admin@beacon',
        senderName: 'Admin',
        subject: 'Admin Compose',
        rawBody: vestaboard_text,
        cleanedBody: vestaboard_text,
        vestaboardText: vestaboard_text,
        status: 'approved',
        reviewedAt: new Date()
      }
    });

    // Post to Vestaboard
    try {
      await postToVestaboard(vestaboard_text);
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'posted',
          postedAt: new Date()
        }
      });
      req.session.flash = { type: 'success', message: 'Message posted to Vestaboard!' };
    } catch (vestaError) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          errorMessage: vestaError.message
        }
      });
      req.session.flash = { type: 'error', message: `Failed to post: ${vestaError.message}` };
    }

    res.redirect('/admin');
  } catch (error) {
    console.error('Compose error:', error);
    req.session.flash = { type: 'error', message: 'Database error' };
    res.redirect('/admin/compose');
  }
});

// GET /admin/message/:id - Review single message
router.get('/message/:id', async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!message) {
      return res.status(404).send('Message not found');
    }

    res.render('review', { message });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).send('Database error');
  }
});

// POST /admin/message/:id/approve
router.post('/message/:id/approve', async (req, res) => {
  try {
    const { vestaboard_text } = req.body;
    const messageId = parseInt(req.params.id);

    // Update message with edited text
    await prisma.message.update({
      where: { id: messageId },
      data: {
        vestaboardText: vestaboard_text,
        status: 'approved',
        reviewedAt: new Date()
      }
    });

    // Post to Vestaboard
    try {
      await postToVestaboard(vestaboard_text);
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'posted',
          postedAt: new Date()
        }
      });
      req.session.flash = { type: 'success', message: 'Message posted to Vestaboard!' };
    } catch (vestaError) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'failed',
          errorMessage: vestaError.message
        }
      });
      req.session.flash = { type: 'error', message: `Failed to post: ${vestaError.message}` };
    }

    res.redirect('/admin');
  } catch (error) {
    console.error('Approve error:', error);
    req.session.flash = { type: 'error', message: 'Database error' };
    res.redirect('/admin');
  }
});

// POST /admin/message/:id/reject
router.post('/message/:id/reject', async (req, res) => {
  try {
    await prisma.message.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'rejected',
        reviewedAt: new Date()
      }
    });
    req.session.flash = { type: 'success', message: 'Message rejected' };
    res.redirect('/admin');
  } catch (error) {
    console.error('Reject error:', error);
    req.session.flash = { type: 'error', message: 'Database error' };
    res.redirect('/admin');
  }
});

// POST /admin/message/:id/retry - Retry failed message
router.post('/message/:id/retry', async (req, res) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(req.params.id),
        status: 'failed'
      }
    });

    if (!message) {
      req.session.flash = { type: 'error', message: 'Message not found or not in failed state' };
      return res.redirect('/admin');
    }

    try {
      await postToVestaboard(message.vestaboardText);
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'posted',
          postedAt: new Date(),
          errorMessage: null
        }
      });
      req.session.flash = { type: 'success', message: 'Message posted to Vestaboard!' };
    } catch (vestaError) {
      await prisma.message.update({
        where: { id: message.id },
        data: { errorMessage: vestaError.message }
      });
      req.session.flash = { type: 'error', message: `Failed to post: ${vestaError.message}` };
    }

    res.redirect('/admin');
  } catch (error) {
    console.error('Retry error:', error);
    req.session.flash = { type: 'error', message: 'Database error' };
    res.redirect('/admin');
  }
});

// POST /admin/message/:id/delete - Delete failed message
router.post('/message/:id/delete', async (req, res) => {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(req.params.id),
        status: 'failed'
      }
    });

    if (!message) {
      req.session.flash = { type: 'error', message: 'Message not found or not in failed state' };
      return res.redirect('/admin');
    }

    await prisma.message.delete({
      where: { id: message.id }
    });

    req.session.flash = { type: 'success', message: 'Failed message deleted' };
    res.redirect('/admin');
  } catch (error) {
    console.error('Delete error:', error);
    req.session.flash = { type: 'error', message: 'Database error' };
    res.redirect('/admin');
  }
});

module.exports = router;
