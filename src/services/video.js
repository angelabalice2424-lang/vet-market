const crypto = require('crypto');

// Nombre de sala difícil de adivinar: nadie puede entrar probando nombres
function newRoomName() {
  return 'vet-' + crypto.randomBytes(12).toString('hex');
}

function newCancelToken() {
  return crypto.randomBytes(24).toString('hex');
}

function roomUrl(room) {
  const base = (process.env.JITSI_BASE_URL || 'https://meet.jit.si').replace(/\/$/, '');
  return `${base}/${room}`;
}

module.exports = { newRoomName, newCancelToken, roomUrl };
