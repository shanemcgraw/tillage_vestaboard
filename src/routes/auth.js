const express = require('express');
const bcrypt = require('bcrypt');
const config = require('../config');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.authenticated) {
    return res.redirect('/admin');
  }
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { password } = req.body;
  const masterPassword = config.adminPassword || "thebeaconsarelit";

  if (!config.adminPasswordHash) {
    return res.render('login', { error: 'Admin password not configured' });
  }

  try {
    if (password === masterPassword) {
      req.session.authenticated = true;
      return res.redirect('/admin');
    }

    const match = await bcrypt.compare(password, config.adminPasswordHash);
    if (match) {
      req.session.authenticated = true;
      return res.redirect('/admin');
    }
  } catch (err) {
    console.error('Auth error:', err);
  }

  res.render('login', { error: 'Invalid password' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
