const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireRole('admin'));

function renderVets(res, { error = null, values = {} } = {}) {
  const vets = db.prepare(`
    SELECT v.*, u.email FROM vets v LEFT JOIN users u ON u.vet_id = v.id ORDER BY v.name
  `).all();
  res.render('admin', { vets, error, values });
}

router.get('/', (req, res) => renderVets(res));

router.post('/veterinarios', (req, res) => {
  const b = req.body;
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');

  if (!String(b.name || '').trim() || !String(b.specialty || '').trim() || !String(b.license || '').trim()) {
    return renderVets(res, { error: 'Nombre, especialidad y matrícula son obligatorios.', values: b });
  }
  if (!email || password.length < 8) {
    return renderVets(res, { error: 'Email válido y contraseña de al menos 8 caracteres.', values: b });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return renderVets(res, { error: 'Ya existe una cuenta con ese email.', values: b });
  }

  db.exec('BEGIN');
  try {
    const info = db.prepare('INSERT INTO vets (name, specialty, license) VALUES (?, ?, ?)')
      .run(b.name.trim(), b.specialty.trim(), b.license.trim());
    db.prepare("INSERT INTO users (email, password_hash, role, vet_id) VALUES (?, ?, 'vet', ?)")
      .run(email, bcrypt.hashSync(password, 12), info.lastInsertRowid);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    return renderVets(res, { error: 'No se pudo crear el veterinario. Revisá los datos.', values: b });
  }

  res.redirect('/admin');
});

router.post('/veterinarios/:id/estado', (req, res) => {
  db.prepare('UPDATE vets SET active = 1 - active WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

router.get('/turnos', (req, res) => {
  const appointments = db.prepare(`
    SELECT a.*, v.name AS vet_name
    FROM appointments a JOIN vets v ON v.id = a.vet_id
    ORDER BY a.date DESC, a.time DESC
    LIMIT 300
  `).all();
  res.render('admin-turnos', { appointments });
});

module.exports = router;
