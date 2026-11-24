const express = require('express');
const { db } = require('../db');
const { availableSlots, nextDays } = require('../services/slots');
const { isUrgent } = require('../services/triage');
const { newRoomName, newCancelToken, roomUrl } = require('../services/video');
const { sendMail } = require('../services/mail');

const router = express.Router();

const REQUIRED = ['owner_name', 'owner_email', 'pet_name', 'pet_species', 'reason', 'symptoms'];

function activeVets() {
  return db.prepare('SELECT id, name, specialty FROM vets WHERE active = 1 ORDER BY name').all();
}

// Renderiza el formulario de reserva con los horarios del veterinario y día elegidos
function renderReservar(res, { status = 200, vetId, date, values = {}, error = null }) {
  const vets = activeVets();
  const days = nextDays(14);
  const vet = vets.find((v) => String(v.id) === String(vetId)) || null;
  const validDate = days.includes(date) ? date : null;
  const slots = vet && validDate ? availableSlots(vet.id, validDate) : [];
  res.status(status).render('reservar', { vets, vet, date: validDate, days, slots, values, error });
}

router.get('/', (req, res) => {
  res.render('home', { vets: activeVets() });
});

router.get('/reservar', (req, res) => {
  renderReservar(res, { vetId: req.query.vet, date: req.query.date });
});

router.post('/reservar', async (req, res) => {
  const b = req.body;
  const days = nextDays(14);
  const vet = db.prepare('SELECT * FROM vets WHERE id = ? AND active = 1').get(b.vet);

  if (!vet || !days.includes(b.date)) {
    return renderReservar(res, { status: 400, vetId: b.vet, date: b.date, values: b, error: 'Elegí un veterinario y un día válidos.' });
  }
  const missing = REQUIRED.filter((f) => !String(b[f] || '').trim());
  if (missing.length || !b.accept) {
    return renderReservar(res, {
      status: 400, vetId: vet.id, date: b.date, values: b,
      error: 'Completá los campos obligatorios y aceptá el aviso para continuar.',
    });
  }
  if (!availableSlots(vet.id, b.date).includes(b.time)) {
    return renderReservar(res, {
      status: 409, vetId: vet.id, date: b.date, values: b,
      error: 'Ese horario ya no está disponible. Elegí otro.',
    });
  }

  const room = newRoomName();
  const token = newCancelToken();
  const urgent = isUrgent(`${b.reason} ${b.symptoms}`) ? 1 : 0;

  try {
    db.prepare(`
      INSERT INTO appointments
        (vet_id, date, time, owner_name, owner_email, owner_phone, pet_name, pet_species,
         pet_breed, pet_age, pet_weight, reason, symptoms, urgent, room, cancel_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vet.id, b.date, b.time, b.owner_name.trim(), b.owner_email.trim().toLowerCase(), (b.owner_phone || '').trim(),
      b.pet_name.trim(), b.pet_species, (b.pet_breed || '').trim(), (b.pet_age || '').trim(), (b.pet_weight || '').trim(),
      b.reason.trim(), b.symptoms.trim(), urgent, room, token
    );
  } catch (err) {
    console.error('Error al crear el turno:', err);
    // Solo es "ocupado" si la restricción única de la base lo frenó
    const ocupado = /UNIQUE/i.test(String(err.message));
    return renderReservar(res, {
      status: ocupado ? 409 : 500, vetId: vet.id, date: b.date, values: b,
      error: ocupado
        ? 'Ese horario acaba de reservarse. Elegí otro.'
        : 'No pudimos guardar el turno por un error interno. Intentá de nuevo en unos minutos.',
    });
  }

  const link = `${res.locals.baseUrl}/turno/${token}`;
  const cuando = `${res.locals.formatDate(b.date)} a las ${b.time} hs`;

  await sendMail({
    to: b.owner_email.trim(),
    subject: `Turno confirmado con ${vet.name}`,
    text: `Hola ${b.owner_name.trim()}.\n\nTu consulta por ${b.pet_name.trim()} quedó reservada para ${cuando}.\n\n` +
      `Link de la videollamada y de tu turno (guardalo):\n${link}\n\n` +
      `Entrá a la sala unos minutos antes desde la compu o el celular.\n` +
      `Esta teleconsulta orienta y da pautas, pero no reemplaza el examen presencial ni una urgencia.`,
  });

  const vetUser = db.prepare('SELECT email FROM users WHERE vet_id = ?').get(vet.id);
  if (vetUser) {
    await sendMail({
      to: vetUser.email,
      subject: `Nuevo turno: ${b.pet_name.trim()} (${cuando})`,
      text: `Nuevo turno para ${cuando}.\nMascota: ${b.pet_name.trim()} (${b.pet_species}).\n` +
        `Motivo: ${b.reason.trim()}\nSíntomas: ${b.symptoms.trim()}\n\n` +
        `Panel: ${res.locals.baseUrl}/vet`,
    });
  }

  res.redirect(`/turno/${token}`);
});

router.get('/turno/:token', (req, res) => {
  const appt = db.prepare(`
    SELECT a.*, v.name AS vet_name, v.specialty
    FROM appointments a JOIN vets v ON v.id = a.vet_id
    WHERE a.cancel_token = ?
  `).get(req.params.token);
  if (!appt) {
    return res.status(404).render('error', { title: 'No encontrado', message: 'No encontramos ese turno.' });
  }
  res.render('turno', { appt, token: req.params.token });
});

router.post('/turno/:token/cancelar', (req, res) => {
  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE cancel_token = ? AND status = 'booked'")
    .run(req.params.token);
  res.redirect(`/turno/${req.params.token}`);
});

module.exports = router;
