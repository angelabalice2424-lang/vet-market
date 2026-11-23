// Señales de alarma: si aparecen, la app avisa que hay que ir a una guardia presencial.
const URGENT_PATTERNS = [
  /convulsi/i,
  /no respira|dificultad (para )?respirar|respira con dificultad|falta de aire|ahogo/i,
  /sangr/i,
  /intoxic|veneno|t[oó]xic|trag[oó]/i,
  /atropell/i,
  /desmay|inconsciente|no responde/i,
  /no (puede|pudo) orinar|no orina|obstrucci[oó]n/i,
  /golpe|traumatismo|ca[ií]da/i,
  /paraliz|no puede (caminar|pararse)|no se para/i,
  /vomit\w* (con )?sangre/i,
];

function isUrgent(text) {
  return URGENT_PATTERNS.some((re) => re.test(text || ''));
}

module.exports = { isUrgent };
