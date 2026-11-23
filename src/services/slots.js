const { db } = require('../db');

const pad = (n) => String(n).padStart(2, '0');
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

function dateToStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function todayStr() {
  return dateToStr(new Date());
}

// Próximos n días desde hoy, en formato YYYY-MM-DD
function nextDays(n) {
  const out = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(dateToStr(d));
  }
  return out;
}

function formatDate(s) {
  return parseDate(s).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Horarios libres de un veterinario para una fecha (YYYY-MM-DD)
function availableSlots(vetId, dateStr) {
  const weekday = parseDate(dateStr).getDay();
  const rules = db
    .prepare('SELECT * FROM availability WHERE vet_id = ? AND weekday = ?')
    .all(vetId, weekday);
  const booked = new Set(
    db
      .prepare("SELECT time FROM appointments WHERE vet_id = ? AND date = ? AND status = 'booked'")
      .all(vetId, dateStr)
      .map((r) => r.time)
  );

  const now = new Date();
  const isToday = dateToStr(now) === dateStr;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots = new Set();
  for (const r of rules) {
    const end = toMin(r.end_time);
    for (let t = toMin(r.start_time); t + r.slot_minutes <= end; t += r.slot_minutes) {
      if (isToday && t <= nowMin) continue;
      const time = fromMin(t);
      if (!booked.has(time)) slots.add(time);
    }
  }
  return [...slots].sort();
}

module.exports = { availableSlots, nextDays, formatDate, todayStr, parseDate };
