// Ilustraciones SVG simples e inline. Sin imágenes externas.
// Se exponen en res.locals.ilu y se imprimen con <%- ilu.familia %> (sin escapar, son SVG fijos).

const familia = `<svg viewBox="0 0 280 200" role="img" aria-label="Un perro y un gato" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="140" cy="182" rx="120" ry="10" fill="#3b2f2a" opacity=".08"/>
  <g>
    <ellipse cx="100" cy="128" rx="58" ry="40" fill="#e8b98f"/>
    <circle cx="100" cy="82" r="32" fill="#e8b98f"/>
    <ellipse cx="74" cy="66" rx="13" ry="22" fill="#c98f63" transform="rotate(-18 74 66)"/>
    <ellipse cx="126" cy="66" rx="13" ry="22" fill="#c98f63" transform="rotate(18 126 66)"/>
    <circle cx="90" cy="80" r="4" fill="#3b2f2a"/><circle cx="110" cy="80" r="4" fill="#3b2f2a"/>
    <ellipse cx="100" cy="94" rx="7" ry="5" fill="#3b2f2a"/>
    <path d="M92 102 Q100 110 108 102" stroke="#3b2f2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M150 140 Q178 118 170 92" stroke="#e8b98f" stroke-width="10" fill="none" stroke-linecap="round"/>
  </g>
  <g>
    <ellipse cx="200" cy="140" rx="46" ry="34" fill="#9aa7ff"/>
    <circle cx="200" cy="100" r="26" fill="#9aa7ff"/>
    <path d="M180 84 L178 62 L194 76 Z" fill="#9aa7ff"/>
    <path d="M220 84 L222 62 L206 76 Z" fill="#9aa7ff"/>
    <circle cx="192" cy="98" r="3.5" fill="#3b2f2a"/><circle cx="208" cy="98" r="3.5" fill="#3b2f2a"/>
    <path d="M196 106 L200 110 L204 106" stroke="#3b2f2a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M240 150 Q262 146 258 124" stroke="#9aa7ff" stroke-width="9" fill="none" stroke-linecap="round"/>
  </g>
  <g fill="#ff9f6b" opacity=".85">
    <circle cx="46" cy="40" r="5"/><circle cx="36" cy="30" r="3"/><circle cx="58" cy="28" r="3"/><circle cx="50" cy="20" r="3"/>
  </g>
</svg>`;

const gato = `<svg viewBox="0 0 120 120" role="img" aria-label="Un gato sentado" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="110" rx="38" ry="6" fill="#3b2f2a" opacity=".08"/>
  <ellipse cx="60" cy="82" rx="30" ry="26" fill="#9aa7ff"/>
  <circle cx="60" cy="48" r="20" fill="#9aa7ff"/>
  <path d="M44 38 L42 20 L56 32 Z" fill="#9aa7ff"/>
  <path d="M76 38 L78 20 L64 32 Z" fill="#9aa7ff"/>
  <circle cx="53" cy="47" r="2.6" fill="#3b2f2a"/><circle cx="67" cy="47" r="2.6" fill="#3b2f2a"/>
  <path d="M57 53 L60 56 L63 53" stroke="#3b2f2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M86 100 Q104 96 100 78" stroke="#9aa7ff" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>`;

const huella = `<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><ellipse cx="12" cy="16" rx="5" ry="4"/><circle cx="6" cy="10" r="2.2"/><circle cx="10" cy="6" r="2.2"/><circle cx="14" cy="6" r="2.2"/><circle cx="18" cy="10" r="2.2"/></g></svg>`;

// Colores suaves para los avatares de veterinarios, elegidos por id
const COLORES_AVATAR = ['#ffd1b3', '#b9e4cf', '#ffe9a8', '#cfd9ff', '#f9c6d9'];
const colorAvatar = (id) => COLORES_AVATAR[Number(id) % COLORES_AVATAR.length];

// Iniciales del nombre, sin el título "Dr./Dra."
function iniciales(nombre) {
  const partes = String(nombre || '')
    .replace(/^(dr|dra|doc)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  return ((partes[0] || '?')[0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
}

module.exports = { familia, gato, huella, colorAvatar, iniciales };
