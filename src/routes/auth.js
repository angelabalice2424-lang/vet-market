const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/vet');
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const ok = user && bcrypt.compareSync(String(req.body.password || ''), user.password_hash);
  if (!ok) {
    return res.status(401).render('login', { error: 'Email o contraseña incorrectos.' });
  }
  req.session.user = { id: user.id, email: user.email, role: user.role, vet_id: user.vet_id };
  res.redirect(user.role === 'admin' ? '/admin' : '/vet');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
