const express = require('express');
const { db } = require('../db');
const { requireRole } = require('../middleware/auth');
const { todayStr } = require('../services/slots');
const { sendMail } = require('../services/mail');

const router = express.Router();
router.use(requireRole('vet'));

// Panel: turnos próximos del veterinario logueado
router.get('/', (req, res) => {
  const appointments = db.prepare(`
    SELECT * FROM appointments
    WHERE vet_id = ? AND status = 'booked' AND date >= ?
    ORDER BY date, time
  `).all(req.session.user.vet_id, todayStr());
  res.render('vet-panel', { appointments });
});

// Disponibilidad semanal
router.get('/disponibilidad', (req, res) => {
  renderDisponibilidad(res, req.session.user.vet_id);
});

function renderDisponibilidad(res, vetId, error = null) {
  const rules = db.prepare(`
    SELECT * FROM availability WHERE vet_id = ? ORDER BY weekday, start_time
  `).all(vetId);
  res.render('vet-disponibilidad', { rules, error });
}

router.post('/disponibilidad', (req, res) => {
  const weekday = Number(req.body.weekday);
  const start = String(req.body.start_time || '');
  const end = String(req.body.end_time || '');
  const slot = Number(req.body.slot_minutes || 20);
  const timeOk = /^\d{2}:\d{2}$/;

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return renderDisponibilidad(res, req.session.user.vet_id, 'Día inválido.');
  }
  if (!timeOk.test(start) || !timeOk.test(end) || start >= end) {
    return renderDisponibilidad(res, req.session.user.vet_id, 'El horario de inicio tiene que ser anterior al de fin.');
  }
  if (!Number.isInteger(slot) || slot < 10 || slot > 120) {
    return renderDisponibilidad(res, req.session.user.vet_id, 'La duración del turno debe estar entre 10 y 120 minutos.');
  }

  db.prepare(`
    INSERT INTO availability (vet_id, weekday, start_time, end_time, slot_minutes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.session.user.vet_id, weekday, start, end, slot);
  res.redirect('/vet/disponibilidad');
});

router.post('/disponibilidad/:id/borrar', (req, res) => {
  db.prepare('DELETE FROM availability WHERE id = ? AND vet_id = ?')
    .run(req.params.id, req.session.user.vet_id);
  res.redirect('/vet/disponibilidad');
});

// Ficha de la consulta: notas y pautas
router.get('/consulta/:id', (req, res) => {
  const appt = findOwnAppointment(req);
  if (!appt) return res.status(404).render('error', { title: 'No encontrado', message: 'Turno no encontrado.' });
  res.render('vet-consulta', { appt, saved: req.query.saved === '1' });
});

router.post('/consulta/:id', async (req, res) => {
  const appt = findOwnAppointment(req);
  if (!appt) return res.status(404).render('error', { title: 'No encontrado', message: 'Turno no encontrado.' });

  const notes = String(req.body.notes || '').trim();
  const done = req.body.done === 'on';
  const sendEmail = req.body.send_email === 'on' && notes.length > 0;

  db.prepare('UPDATE appointments SET notes = ?, status = ? WHERE id = ?')
    .run(notes, done ? 'done' : appt.status, appt.id);

  if (sendEmail) {
    await sendMail({
      to: appt.owner_email,
      subject: `Pautas para ${appt.pet_name}`,
      text: `Hola ${appt.owner_name}.\n\nPautas indicadas en la consulta de ${appt.pet_name}:\n\n${notes}\n\n` +
        `Si los síntomas empeoran o aparecen señales de alarma, llevala a una veterinaria de guardia sin demorar.`,
    });
  }
  res.redirect(`/vet/consulta/${appt.id}?saved=1`);
});

function findOwnAppointment(req) {
  return db.prepare(`
    SELECT * FROM appointments WHERE id = ? AND vet_id = ?
  `).get(req.params.id, req.session.user.vet_id);
}

module.exports = router;
