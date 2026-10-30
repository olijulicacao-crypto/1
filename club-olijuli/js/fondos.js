// Fondos de pantalla para el celular con el michi (1080x2340), dejando espacio arriba para la hora.
import { esc, toast, esperarFuentes, compartirODescargar } from './util.js';
import { gatoActivo } from './datos.js';
import { michiDe, michiImagen, michiSVG } from './michi.js';

const W = 1080, H = 2340;

export const FONDOS = [
  { id: 'atardecer', nombre: 'Atardecer OliJuli' },
  { id: 'patron', nombre: 'Michis por todos lados' },
  { id: 'noche', nombre: 'Noche estrellada' }
];

function huella(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 6, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
  [[-12, -5], [-5, -12], [5, -12], [12, -5]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 4.4, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

async function atardecer(ctx, cfg, nombre) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#FF8A3D'); g.addColorStop(0.45, '#FFB46B'); g.addColorStop(0.75, '#FFE6D1'); g.addColorStop(1, '#FFF7EF');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,240,200,.9)'; ctx.beginPath(); ctx.arc(W / 2, 1380, 260, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFC48C';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 1560 - Math.sin(x / 170) * 70);
  ctx.lineTo(W, H); ctx.fill();
  ctx.fillStyle = '#FFF0DC';
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 1760 - Math.sin(x / 120 + 1) * 50);
  ctx.lineTo(W, H); ctx.fill();
  const michi = await michiImagen(Object.assign({}, cfg, { accesorio: 'mochila' }), { expresion: 'feliz', tam: 800, margen: 4, extra: 'corazones' });
  if (michi) ctx.drawImage(michi, W / 2 - 400, 1180, 800, 800);
  ctx.fillStyle = '#3B2314';
  ctx.textAlign = 'center';
  ctx.font = '800 92px Poppins, "Arial Black", sans-serif';
  ctx.fillText(nombre, W / 2, 2130, W - 120);
  ctx.font = '700 40px "Nunito Sans", Arial, sans-serif';
  ctx.fillStyle = '#6E5546';
  ctx.fillText('Explorando el mundo juntos · Club OliJuli', W / 2, 2200, W - 120);
}

async function patron(ctx, cfg) {
  ctx.fillStyle = '#FFF0DC'; ctx.fillRect(0, 0, W, H);
  const caras = await Promise.all([
    michiImagen(cfg, { tam: 300 }), michiImagen(cfg, { tam: 300, expresion: 'feliz' }),
    michiImagen(cfg, { tam: 300, expresion: 'amor' }), michiImagen(cfg, { tam: 300, expresion: 'dormido' })
  ]);
  let k = 0;
  for (let fila = 0, y = 120; y < H + 200; fila++, y += 300) {
    for (let x = (fila % 2) * 180 - 60; x < W + 200; x += 360) {
      const img = caras[k++ % caras.length];
      ctx.save(); ctx.translate(x, y); ctx.rotate(((k % 5) - 2) * 0.08);
      if (img) ctx.drawImage(img, -120, -120, 240, 240);
      ctx.restore();
      huella(ctx, x + 180, y + 30, 1.6, 'rgba(232,85,0,.22)');
    }
  }
  // franja para la hora más despejada
  const g = ctx.createLinearGradient(0, 0, 0, 900);
  g.addColorStop(0, 'rgba(255,240,220,.92)'); g.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
}

async function noche(ctx, cfg, nombre) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0F1530'); g.addColorStop(0.6, '#1F2A4D'); g.addColorStop(1, '#3B2C5A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  let semilla = 7;
  const azar = () => { semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; };
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + azar() * 0.6})`;
    ctx.beginPath(); ctx.arc(azar() * W, azar() * H * 0.8, 1 + azar() * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#FFE6A8'; ctx.beginPath(); ctx.arc(800, 1050, 120, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1F2A4D'; ctx.beginPath(); ctx.arc(850, 1010, 110, 0, Math.PI * 2); ctx.fill();
  // nube-cojín
  ctx.fillStyle = '#E8E2F5';
  [[300, 1900, 190], [540, 1850, 240], [780, 1900, 190], [540, 1980, 260]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); });
  const michi = await michiImagen(cfg, { expresion: 'dormido', extra: 'zzz', tam: 760, margen: 4 });
  if (michi) ctx.drawImage(michi, W / 2 - 380, 1230, 760, 760);
  ctx.fillStyle = '#FFF7EF'; ctx.textAlign = 'center';
  ctx.font = '800 80px Poppins, "Arial Black", sans-serif';
  ctx.fillText(`Dulces sueños, ${nombre}`, W / 2, 2240, W - 120);
}

export async function dibujarFondo(id, gato) {
  await esperarFuentes();
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const cfg = michiDe(gato);
  if (id === 'patron') await patron(ctx, cfg);
  else if (id === 'noche') await noche(ctx, cfg, gato.nombre);
  else await atardecer(ctx, cfg, gato.nombre);
  return c;
}

export function renderFondos(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow">Fondos de pantalla</p>
      <h1>Fondos con ${esc(gato.nombre)}</h1>
      <p class="muted">Toca uno para guardarlo. Después, en tu celular: <b>Ajustes → Fondo de pantalla</b> y elige la imagen.</p>
    </div>
    <div class="fondos">${FONDOS.map(f => `<button type="button" class="fondo" data-id="${f.id}"><span class="fondo__img">${michiSVG(michiDe(gato), { tam: 80 })}</span><b>${esc(f.nombre)}</b></button>`).join('')}</div>
    <a class="btn btn--secundario btn--bloque" href="#/michi">🎨 Cambiar mi michi</a>
  `;
  const lienzos = {};
  (async () => {
    for (const f of FONDOS) {
      const c = await dibujarFondo(f.id, gato);
      lienzos[f.id] = c;
      const b = el.querySelector(`[data-id="${f.id}"] .fondo__img`);
      if (b) b.innerHTML = `<img src="${c.toDataURL('image/jpeg', 0.7)}" alt="Fondo ${esc(f.nombre)}">`;
    }
  })();
  el.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
    const c = lienzos[b.dataset.id];
    if (!c) { toast('Espera un segundo, se está dibujando…'); return; }
    c.toBlob(async blob => {
      const r = await compartirODescargar(blob, `fondo-${b.dataset.id}-${gato.nombre.toLowerCase().replace(/[^a-z0-9ñ]+/gi, '-')}.jpg`, 'Fondo de pantalla', '');
      if (r === 'descargado') toast('Fondo guardado ⬇️');
    }, 'image/jpeg', 0.92);
  }));
}
