// Crea tu Michi: el personaje dibujado del gato (SVG propio, sin imágenes externas) y su editor.
import { esc, toast, cargarImagen } from './util.js';
import { gatoActivo, guardarGato } from './datos.js';

const LINEA = '#3B2314';

export const PELAJES = {
  naranjo: { nombre: 'Naranjo', color: '#F2994A' },
  crema: { nombre: 'Crema', color: '#F3D3A3' },
  cafe: { nombre: 'Café', color: '#8B5A3C' },
  negro: { nombre: 'Negro', color: '#2E2A2A' },
  gris: { nombre: 'Gris', color: '#A3A8AE' },
  azulado: { nombre: 'Gris azulado', color: '#6E7B8B' },
  blanco: { nombre: 'Blanco', color: '#F8F4EE' }
};

export const PATRONES = {
  liso: 'Liso', atigrado: 'Atigrado', manchas: 'Manchas', bicolor: 'Bicolor', carey: 'Carey', siames: 'Siamés'
};

export const OJOS = {
  verde: { nombre: 'Verdes', color: '#6BBF59' },
  amarillo: { nombre: 'Amarillos', color: '#F2C94C' },
  ambar: { nombre: 'Ámbar', color: '#E89B2F' },
  azul: { nombre: 'Azules', color: '#56A3E8' },
  cafe: { nombre: 'Café', color: '#8B5A2B' },
  hetero: { nombre: 'Uno de cada color', color: 'linear-gradient(90deg,#56A3E8 50%,#F2C94C 50%)' }
};

export const FORMAS_OJOS = { redondos: 'Redondos', brillantes: 'Brillantes', felices: 'Felices', dormilones: 'Dormilones' };
export const OREJAS = { puntiagudas: 'Puntiagudas', redondeadas: 'Redondeadas', dobladas: 'Dobladas' };

export const ACCESORIOS = {
  ninguno: '🚫 Ninguno', mochila: '🎒 Mochila OliJuli', collar: '🔔 Collar', panuelo: '🧣 Pañuelo',
  mono: '🎀 Moño', lentes: '🤓 Lentes', gorro: '🧢 Gorro', corona: '👑 Corona'
};

// Los mismos colores de la mochila MichiGo de la tienda.
export const MOCHILAS = {
  naranjo: { nombre: 'Naranjo OliJuli', color: '#E85500' },
  azul: { nombre: 'Azul', color: '#2B48C9' },
  rojo: { nombre: 'Rojo', color: '#D93A3A' },
  marino: { nombre: 'Azul marino', color: '#1F2A4D' },
  negro: { nombre: 'Negro', color: '#1E1E1E' },
  rosado: { nombre: 'Rosado', color: '#E8A3C4' }
};

export function michiPorDefecto(gato) {
  const t = ((gato && gato.color) || '').toLowerCase();
  const c = { pelaje: 'naranjo', patron: 'atigrado', color2: 'cafe', ojos: 'verde', formaOjos: 'redondos', orejas: 'puntiagudas', accesorio: 'mochila', mochila: 'naranjo' };
  if (/negr/.test(t)) Object.assign(c, { pelaje: 'negro', patron: 'liso', ojos: 'amarillo' });
  else if (/blanc/.test(t) && !/con blanc|y blanc/.test(t)) Object.assign(c, { pelaje: 'blanco', patron: 'liso', ojos: 'azul' });
  else if (/gris|plom/.test(t)) Object.assign(c, { pelaje: 'gris', patron: /atigr|rayas/.test(t) ? 'atigrado' : 'liso', color2: 'azulado', ojos: 'amarillo' });
  else if (/tricolor|carey|calic/.test(t)) Object.assign(c, { pelaje: 'blanco', patron: 'carey', color2: 'naranjo', ojos: 'ambar' });
  else if (/siam/.test(t)) Object.assign(c, { pelaje: 'crema', patron: 'siames', color2: 'cafe', ojos: 'azul' });
  else if (/caf|marr|chocol/.test(t)) Object.assign(c, { pelaje: 'cafe', patron: /atigr/.test(t) ? 'atigrado' : 'liso', color2: 'negro', ojos: 'ambar' });
  else if (/crema|beige/.test(t)) Object.assign(c, { pelaje: 'crema', color2: 'naranjo' });
  if (/con blanc|y blanc|bicolor/.test(t) && c.patron !== 'carey') Object.assign(c, { patron: 'bicolor', color2: 'blanco' });
  return c;
}

export function michiDe(gato) {
  return Object.assign(michiPorDefecto(gato), (gato && gato.michi) || {});
}

function oscuro(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.35;
}

function espejo(d) {
  return `<g transform="translate(240 0) scale(-1 1)">${d}</g>`;
}

let contador = 0;

/*
  Dibuja el michi. Opciones:
  - expresion: 'feliz' | 'enojado' | 'dormido' | 'hambre' | 'amor' | 'sorpresa' (si no, usa la forma de ojos elegida)
  - extra: 'corazones' | 'zzz' | 'plato' | 'exclamacion' | 'sol' | 'hojas'
  - margen: espacio alrededor (para stickers y fondos)
*/
export function michiSVG(cfg, o = {}) {
  const c = Object.assign(michiPorDefecto(null), cfg || {});
  const id = 'm' + (++contador);
  const base = (PELAJES[c.pelaje] || PELAJES.naranjo).color;
  const sec = (PELAJES[c.color2] || PELAJES.cafe).color;
  const rasgos = oscuro(base) ? '#F3E6DA' : LINEA;
  const rosado = '#F28B82';
  const m = o.margen || 0;
  const tam = o.tam || 240;
  const ojoColor = lado => c.ojos === 'hetero' ? (lado === 'i' ? OJOS.azul.color : OJOS.amarillo.color) : (OJOS[c.ojos] || OJOS.verde).color;
  const conMochila = c.accesorio === 'mochila';
  const colorPatas = c.patron === 'bicolor' ? sec : c.patron === 'siames' ? sec : base;
  const s = [];

  s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-m} ${-m} ${240 + m * 2} ${240 + m * 2}" width="${tam}" height="${tam}">`);
  s.push(`<defs>
    <clipPath id="${id}c"><ellipse cx="120" cy="180" rx="50" ry="44"/></clipPath>
    <clipPath id="${id}h"><ellipse cx="120" cy="108" rx="62" ry="52"/></clipPath>
    <pattern id="${id}r" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="2.2" fill="rgba(0,0,0,.22)"/></pattern>
  </defs>`);
  if (o.fondo) s.push(`<rect x="${-m}" y="${-m}" width="${240 + m * 2}" height="${240 + m * 2}" fill="${o.fondo}"/>`);

  // Cola y cuerpo
  if (!conMochila) {
    const colaColor = c.patron === 'siames' ? sec : base;
    s.push(`<path d="M160 204 C200 204 212 168 194 138" fill="none" stroke="${LINEA}" stroke-width="19" stroke-linecap="round"/>`);
    s.push(`<path d="M160 204 C200 204 212 168 194 138" fill="none" stroke="${colaColor}" stroke-width="12" stroke-linecap="round"/>`);
    if (c.patron === 'atigrado') s.push(`<path d="M188 190 l8 -4 M200 168 l9 0 M199 150 l8 3" stroke="${sec}" stroke-width="5" stroke-linecap="round"/>`);
  }
  s.push(`<ellipse cx="120" cy="180" rx="50" ry="44" fill="${base}" stroke="${LINEA}" stroke-width="3"/>`);
  s.push(`<g clip-path="url(#${id}c)">`);
  if (c.patron === 'atigrado') s.push(`<path d="M74 166 q12 4 16 15 M72 188 q13 3 17 13 M166 166 q-12 4 -16 15 M168 188 q-13 3 -17 13" stroke="${sec}" stroke-width="6" stroke-linecap="round" fill="none"/>`);
  if (c.patron === 'manchas') s.push(`<ellipse cx="94" cy="192" rx="15" ry="11" fill="${sec}"/><ellipse cx="150" cy="170" rx="12" ry="9" fill="${sec}"/>`);
  if (c.patron === 'bicolor') s.push(`<ellipse cx="120" cy="192" rx="28" ry="36" fill="${sec}"/>`);
  if (c.patron === 'carey') s.push(`<ellipse cx="90" cy="172" rx="24" ry="19" fill="${sec}"/><ellipse cx="152" cy="198" rx="22" ry="17" fill="#3A2A22"/><ellipse cx="140" cy="160" rx="10" ry="8" fill="#3A2A22"/>`);
  s.push('</g>');
  if (!conMochila) {
    s.push(`<ellipse cx="101" cy="218" rx="15" ry="10" fill="${colorPatas}" stroke="${LINEA}" stroke-width="3"/><ellipse cx="139" cy="218" rx="15" ry="10" fill="${colorPatas}" stroke="${LINEA}" stroke-width="3"/>`);
    s.push(`<path d="M96 222 v-5 M106 222 v-5 M134 222 v-5 M144 222 v-5" stroke="${oscuro(colorPatas) ? '#F3E6DA' : LINEA}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`);
  }

  // Mochila OliJuli (va sobre el cuerpo y debajo de la cabeza)
  if (conMochila) {
    const bolso = (MOCHILAS[c.mochila] || MOCHILAS.naranjo).color;
    s.push(`<rect x="54" y="140" width="132" height="94" rx="30" fill="${bolso}" stroke="${LINEA}" stroke-width="3"/>`);
    s.push(`<rect x="66" y="160" width="108" height="64" rx="20" fill="url(#${id}r)"/>`);
    s.push(`<path d="M68 168 V218 M172 168 V218" stroke="rgba(255,255,255,.55)" stroke-width="2.5" stroke-dasharray="5 4"/>`);
    s.push(`<rect x="54" y="140" width="132" height="18" rx="9" fill="#1E1E1E"/>`);
    s.push(`<g transform="translate(120 196)" fill="#FFFFFF" opacity=".95"><ellipse cx="0" cy="5" rx="9" ry="7.5"/><circle cx="-10" cy="-4" r="3.6"/><circle cx="-4" cy="-10" r="3.6"/><circle cx="4" cy="-10" r="3.6"/><circle cx="10" cy="-4" r="3.6"/></g>`);
    s.push(`<ellipse cx="101" cy="150" rx="14" ry="9" fill="${colorPatas}" stroke="${LINEA}" stroke-width="3"/><ellipse cx="139" cy="150" rx="14" ry="9" fill="${colorPatas}" stroke="${LINEA}" stroke-width="3"/>`);
  }

  // Orejas
  const orejaColor = c.patron === 'siames' ? sec : base;
  let oreja, interior = '';
  if (c.orejas === 'redondeadas') {
    oreja = `<path d="M70 86 Q68 32 113 60 Z" fill="${orejaColor}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>`;
    interior = `<path d="M80 76 Q80 48 103 63 Z" fill="#F6A6A6"/>`;
  } else if (c.orejas === 'dobladas') {
    oreja = `<path d="M70 78 Q76 52 108 60 Q98 72 74 84 Z" fill="${orejaColor}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>`;
  } else {
    oreja = `<path d="M72 84 L80 30 L114 62 Z" fill="${orejaColor}" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/>`;
    interior = `<path d="M81 75 L85 45 L104 64 Z" fill="#F6A6A6"/>`;
  }
  s.push(oreja + interior + espejo(oreja + interior));

  // Cabeza y su pelaje
  s.push(`<ellipse cx="120" cy="108" rx="62" ry="52" fill="${base}" stroke="${LINEA}" stroke-width="3"/>`);
  s.push(`<g clip-path="url(#${id}h)">`);
  if (c.patron === 'atigrado') s.push(`<path d="M120 58 v18 M105 61 l3 14 M135 61 l-3 14 M56 102 h17 M58 115 h14 M184 102 h-17 M182 115 h-14" stroke="${sec}" stroke-width="6" stroke-linecap="round"/>`);
  if (c.patron === 'manchas') s.push(`<ellipse cx="90" cy="78" rx="17" ry="12" fill="${sec}"/><ellipse cx="156" cy="126" rx="11" ry="8" fill="${sec}"/>`);
  if (c.patron === 'bicolor') s.push(`<path d="M120 66 C108 94 82 108 72 146 Q120 176 168 146 C158 108 132 94 120 66 Z" fill="${sec}"/>`);
  if (c.patron === 'carey') s.push(`<path d="M56 78 Q88 56 117 64 L112 164 Q66 164 54 120 Z" fill="${sec}"/><ellipse cx="160" cy="80" rx="14" ry="10" fill="#3A2A22"/><ellipse cx="150" cy="140" rx="9" ry="7" fill="#3A2A22"/>`);
  if (c.patron === 'siames') s.push(`<ellipse cx="120" cy="122" rx="36" ry="30" fill="${sec}" opacity=".9"/>`);
  s.push('</g>');
  if (c.patron !== 'bicolor') s.push(`<ellipse cx="120" cy="127" rx="21" ry="13" fill="#FFFFFF" opacity=".28"/>`);
  s.push(`<ellipse cx="86" cy="128" rx="9" ry="5" fill="${rosado}" opacity=".45"/><ellipse cx="154" cy="128" rx="9" ry="5" fill="${rosado}" opacity=".45"/>`);

  // Ojos
  const ex = o.expresion || ({ felices: 'feliz', dormilones: 'dormido' }[c.formaOjos]) || '';
  const grandes = c.formaOjos === 'brillantes';
  const ojo = (x, lado) => {
    const t = `translate(${x} 106)`;
    if (ex === 'feliz') return `<path transform="${t}" d="M-10 3 Q0 -9 10 3" fill="none" stroke="${rasgos}" stroke-width="3.5" stroke-linecap="round"/>`;
    if (ex === 'dormido') return `<path transform="${t}" d="M-10 -1 Q0 8 10 -1" fill="none" stroke="${rasgos}" stroke-width="3.5" stroke-linecap="round"/>`;
    if (ex === 'amor') return `<path transform="${t} scale(1.1)" d="M0 9 C-14 0 -12 -10 -5 -10 C-2 -10 0 -7 0 -5 C0 -7 2 -10 5 -10 C12 -10 14 0 0 9 Z" fill="#E53950" stroke="${LINEA}" stroke-width="2"/>`;
    const r = ex === 'sorpresa' ? 13 : grandes ? 14 : 12;
    const iris = ex === 'sorpresa' ? 6 : grandes ? 11 : 9;
    let e = `<g transform="${t}"><circle r="${r}" fill="#FFFFFF" stroke="${LINEA}" stroke-width="2.5"/><circle r="${iris}" fill="${ojoColor(lado)}"/>`;
    e += ex === 'sorpresa' ? `<circle r="3" fill="#1D1411"/>` : `<ellipse rx="${grandes ? 4.5 : 3.6}" ry="${grandes ? 8.5 : 7}" fill="#1D1411"/>`;
    e += `<circle cx="3.5" cy="-4.5" r="${grandes ? 3.6 : 2.8}" fill="#FFFFFF"/>`;
    if (grandes) e += `<circle cx="-4" cy="4" r="1.8" fill="#FFFFFF"/>`;
    if (ex === 'enojado') {
      const inclin = lado === 'i' ? 'M-15 -15 L15 -15 L15 -3 L-15 -10 Z' : 'M-15 -15 L15 -15 L15 -10 L-15 -3 Z';
      const borde = lado === 'i' ? 'M-14 -10 L14 -3' : 'M-14 -3 L14 -10';
      e += `<path d="${inclin}" fill="${base}"/><path d="${borde}" stroke="${rasgos}" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    return e + '</g>';
  };
  s.push(ojo(97, 'i') + ojo(143, 'd'));

  // Nariz, boca y bigotes
  s.push(`<path d="M113 119 h14 l-7 7.5 z" fill="${rosado}" stroke="${LINEA}" stroke-width="2" stroke-linejoin="round"/>`);
  if (ex === 'hambre') s.push(`<path d="M108 131 Q120 154 132 131 Z" fill="#7A2E2E" stroke="${rasgos}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="120" cy="143" rx="6" ry="4" fill="#F28B82"/>`);
  else if (ex === 'enojado') s.push(`<path d="M110 135 q10 -6 20 0" fill="none" stroke="${rasgos}" stroke-width="2.8" stroke-linecap="round"/>`);
  else if (ex === 'sorpresa') s.push(`<ellipse cx="120" cy="136" rx="5" ry="6.5" fill="#7A2E2E" stroke="${rasgos}" stroke-width="2"/>`);
  else if (ex === 'feliz' || ex === 'amor') s.push(`<path d="M108 128 Q120 142 132 128" fill="none" stroke="${rasgos}" stroke-width="2.8" stroke-linecap="round"/>`);
  else s.push(`<path d="M120 127 q-5 7 -11 2 M120 127 q5 7 11 2" fill="none" stroke="${rasgos}" stroke-width="2.6" stroke-linecap="round"/>`);
  const bigotes = `<path d="M84 122 h-28 M86 130 l-27 6" stroke="${rasgos}" stroke-width="2" stroke-linecap="round" opacity=".75"/>`;
  s.push(bigotes + espejo(bigotes));

  // Accesorios
  if (c.accesorio === 'collar') s.push(`<path d="M80 152 Q120 178 160 152" fill="none" stroke="#D93A3A" stroke-width="9" stroke-linecap="round"/><circle cx="120" cy="169" r="7.5" fill="#FFC04D" stroke="${LINEA}" stroke-width="2"/><path d="M117 171 h6" stroke="${LINEA}" stroke-width="1.8" stroke-linecap="round"/>`);
  if (c.accesorio === 'panuelo') s.push(`<path d="M80 150 Q120 172 160 150 L120 204 Z" fill="#2BB3A3" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="108" cy="170" r="2.6" fill="#fff"/><circle cx="132" cy="170" r="2.6" fill="#fff"/><circle cx="120" cy="186" r="2.6" fill="#fff"/>`);
  if (c.accesorio === 'mono') s.push(`<g transform="translate(152 62) rotate(18)"><path d="M0 0 L-20 -12 L-20 12 Z M0 0 L20 -12 L20 12 Z" fill="#F48FB1" stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round"/><circle r="6" fill="#E85D8E" stroke="${LINEA}" stroke-width="2.5"/></g>`);
  if (c.accesorio === 'lentes') s.push(`<g fill="rgba(255,255,255,.18)" stroke="${LINEA}" stroke-width="3.5"><circle cx="97" cy="106" r="16"/><circle cx="143" cy="106" r="16"/></g><path d="M113 104 q7 -6 14 0 M81 102 l-20 -6 M159 102 l20 -6" fill="none" stroke="${LINEA}" stroke-width="3.5" stroke-linecap="round"/>`);
  if (c.accesorio === 'gorro') s.push(`<path d="M60 92 Q62 36 120 34 Q178 36 180 92 Z" fill="#E85500" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/><rect x="56" y="80" width="128" height="18" rx="9" fill="#FF9A4D" stroke="${LINEA}" stroke-width="3"/><circle cx="120" cy="32" r="11" fill="#FFF7EF" stroke="${LINEA}" stroke-width="3"/>`);
  if (c.accesorio === 'corona') s.push(`<path d="M88 64 L93 34 L107 50 L120 26 L133 50 L147 34 L152 64 Z" fill="#FFC04D" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/><circle cx="120" cy="52" r="4.5" fill="#E53950"/><circle cx="101" cy="56" r="3.5" fill="#56A3E8"/><circle cx="139" cy="56" r="3.5" fill="#56A3E8"/>`);

  // Detalles para stickers
  const extra = o.extra || '';
  if (extra === 'corazones') s.push(`<g fill="#E53950" stroke="${LINEA}" stroke-width="2"><path transform="translate(40 50) scale(1.2)" d="M0 9 C-14 0 -12 -10 -5 -10 C-2 -10 0 -7 0 -5 C0 -7 2 -10 5 -10 C12 -10 14 0 0 9 Z"/><path transform="translate(204 40) scale(.9)" d="M0 9 C-14 0 -12 -10 -5 -10 C-2 -10 0 -7 0 -5 C0 -7 2 -10 5 -10 C12 -10 14 0 0 9 Z"/><path transform="translate(212 96) scale(.7)" d="M0 9 C-14 0 -12 -10 -5 -10 C-2 -10 0 -7 0 -5 C0 -7 2 -10 5 -10 C12 -10 14 0 0 9 Z"/></g>`);
  if (extra === 'zzz') s.push(`<g fill="none" stroke="#56A3E8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M176 40 h16 l-16 18 h16"/><path d="M200 12 h12 l-12 13 h12"/><path d="M158 66 h10 l-10 11 h10"/></g>`);
  if (extra === 'plato') s.push(`<path d="M2 212 h56 l-8 22 h-40 z" fill="#56A3E8" stroke="${LINEA}" stroke-width="3" stroke-linejoin="round"/><path d="M10 212 q20 -14 40 0" fill="#C8834B" stroke="${LINEA}" stroke-width="2.5"/>`);
  if (extra === 'exclamacion') s.push(`<g fill="#E53950" stroke="${LINEA}" stroke-width="2.5"><path d="M196 22 l12 0 l-3 44 l-6 0 z"/><circle cx="202" cy="80" r="6"/></g>`);
  if (extra === 'sol') s.push(`<g transform="translate(206 34)"><circle r="16" fill="#FFC04D" stroke="${LINEA}" stroke-width="3"/><path d="M0 -26 v-8 M0 26 v8 M-26 0 h-8 M26 0 h8 M-18 -18 l-6 -6 M18 18 l6 6 M-18 18 l-6 6 M18 -18 l6 -6" stroke="#FFC04D" stroke-width="4" stroke-linecap="round"/></g>`);
  if (extra === 'hojas') s.push(`<g stroke="${LINEA}" stroke-width="2.5"><path d="M30 40 q20 -24 34 0 q-14 18 -34 0 z" fill="#6BBF59"/><path d="M196 196 q20 -24 34 0 q-14 18 -34 0 z" fill="#4E9F3D"/></g>`);

  s.push('</svg>');
  return s.join('');
}

export function michiImagen(cfg, o) {
  return cargarImagen('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(michiSVG(cfg, o)));
}

/* ---------- Editor ---------- */
function swatches(nombre, lista, actual) {
  return `<div class="swatches" role="radiogroup" aria-label="${esc(nombre)}">${Object.entries(lista).map(([k, v]) =>
    `<button type="button" class="swatch ${k === actual ? 'activo' : ''}" data-k="${k}" aria-label="${esc(v.nombre)}" title="${esc(v.nombre)}" style="background:${v.color}"></button>`).join('')}</div>`;
}

function chips(lista, actual) {
  return `<div class="segmentos segmentos--wrap">${Object.entries(lista).map(([k, v]) =>
    `<button type="button" data-k="${k}" class="${k === actual ? 'activo' : ''}">${esc(v)}</button>`).join('')}</div>`;
}

function azar(obj) {
  const k = Object.keys(obj);
  return k[Math.floor(Math.random() * k.length)];
}

export function renderMichi(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  const cfg = michiDe(gato);
  const nuevo = !gato.michi;

  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow">Crea tu Michi</p>
      <h1>${nuevo ? 'Dibuja a ' + esc(gato.nombre) : 'El michi de ' + esc(gato.nombre)}</h1>
      <p class="muted">Elige su pelaje, ojos y accesorios. Este personaje aparece en los stickers, el juego y los fondos.</p>
    </div>
    <div class="michi-escenario"><div id="michiVista"></div></div>
    <div class="tarjeta michi-opciones" id="opciones"></div>
    <div class="pila">
      <button class="btn btn--primario btn--bloque" type="button" id="guardarMichi">Guardar mi michi</button>
      <button class="btn btn--secundario btn--bloque" type="button" id="azar">🎲 Sorpréndeme</button>
    </div>
  `;

  const vista = el.querySelector('#michiVista');
  const opciones = el.querySelector('#opciones');

  function dibujar() {
    vista.innerHTML = michiSVG(cfg, { tam: 260 });
    const necesitaSec = ['atigrado', 'manchas', 'bicolor', 'carey', 'siames'].includes(cfg.patron);
    opciones.innerHTML = `
      <h3>Pelaje</h3>${swatches('Pelaje', PELAJES, cfg.pelaje)}
      <h3>Diseño del pelaje</h3>${chips(PATRONES, cfg.patron)}
      ${necesitaSec ? `<h3>Color de ${cfg.patron === 'bicolor' ? 'la parte clara' : cfg.patron === 'siames' ? 'la cara y patas' : 'las ' + (cfg.patron === 'atigrado' ? 'rayas' : 'manchas')}</h3>${swatches('Segundo color', PELAJES, cfg.color2)}` : ''}
      <h3>Ojos</h3>${swatches('Color de ojos', OJOS, cfg.ojos)}
      ${chips(FORMAS_OJOS, cfg.formaOjos)}
      <h3>Orejas</h3>${chips(OREJAS, cfg.orejas)}
      <h3>Accesorio</h3>${chips(ACCESORIOS, cfg.accesorio)}
      ${cfg.accesorio === 'mochila' ? `<h3>Color de la mochila</h3>${swatches('Color de la mochila', MOCHILAS, cfg.mochila)}` : ''}
    `;
    const grupos = opciones.querySelectorAll('.swatches, .segmentos');
    const claves = ['pelaje', 'patron'];
    if (necesitaSec) claves.push('color2');
    claves.push('ojos', 'formaOjos', 'orejas', 'accesorio');
    if (cfg.accesorio === 'mochila') claves.push('mochila');
    grupos.forEach((g, i) => g.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      cfg[claves[i]] = b.dataset.k;
      if (claves[i] === 'patron' && cfg.patron === 'bicolor' && cfg.color2 === cfg.pelaje) cfg.color2 = 'blanco';
      dibujar();
    })));
  }

  el.querySelector('#azar').addEventListener('click', () => {
    Object.assign(cfg, {
      pelaje: azar(PELAJES), patron: azar(PATRONES), color2: azar(PELAJES), ojos: azar(OJOS),
      formaOjos: azar(FORMAS_OJOS), orejas: azar(OREJAS), accesorio: azar(ACCESORIOS), mochila: azar(MOCHILAS)
    });
    if (cfg.color2 === cfg.pelaje) cfg.color2 = cfg.pelaje === 'blanco' ? 'naranjo' : 'blanco';
    dibujar();
  });

  el.querySelector('#guardarMichi').addEventListener('click', () => {
    gato.michi = Object.assign({}, cfg);
    if (!guardarGato(gato)) { toast('No hay espacio en el teléfono para guardar.', 4000); return; }
    toast(`¡Listo! Este es el michi de ${gato.nombre} 🎨`);
    location.hash = '#/stickers';
  });

  dibujar();
}
