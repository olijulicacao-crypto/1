// Pack de stickers: el michi con frases, en PNG de 512x512 con fondo transparente.
import { esc, toast, esperarFuentes, compartirODescargar, descargar } from './util.js';
import { gatoActivo } from './datos.js';
import { michiDe, michiImagen } from './michi.js';

export const STICKERS = [
  { id: 'hambre', frase: 'Tengo hambre', expresion: 'hambre', extra: 'plato' },
  { id: 'molestes', frase: 'No me molestes', expresion: 'enojado' },
  { id: 'explorador', frase: 'Modo explorador', expresion: 'feliz', extra: 'hojas', mochila: true },
  { id: 'amor', frase: 'Te amo, humano', expresion: 'amor', extra: 'corazones' },
  { id: 'siesta', frase: 'Modo siesta', expresion: 'dormido', extra: 'zzz' },
  { id: 'buenosdias', frase: '¡Buenos días!', expresion: 'feliz', extra: 'sol' },
  { id: 'quehiciste', frase: '¿Qué hiciste?', expresion: 'sorpresa', extra: 'exclamacion' },
  { id: 'gracias', frase: 'Gracias, humano', expresion: 'feliz', extra: 'corazones' }
];

const LADO = 512;

function ajustar(ctx, texto, ancho) {
  let px = 70;
  do {
    ctx.font = `800 ${px}px Poppins, "Arial Black", sans-serif`;
    if (ctx.measureText(texto).width <= ancho) break;
    px -= 3;
  } while (px > 34);
}

// Contorno blanco "de sticker": se dibuja la silueta en blanco varias veces alrededor.
function conContorno(ctx, img, x, y, w, h, grosor) {
  const c = document.createElement('canvas');
  c.width = LADO; c.height = LADO;
  const s = c.getContext('2d');
  s.drawImage(img, x, y, w, h);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = '#FFFFFF';
  s.fillRect(0, 0, LADO, LADO);
  for (let a = 0; a < 360; a += 20) {
    const r = a * Math.PI / 180;
    ctx.drawImage(c, Math.cos(r) * grosor, Math.sin(r) * grosor);
  }
  ctx.drawImage(img, x, y, w, h);
}

export async function dibujarSticker(cfg, st) {
  await esperarFuentes();
  const conf = st.mochila ? Object.assign({}, cfg, { accesorio: 'mochila' }) : cfg;
  const img = await michiImagen(conf, { expresion: st.expresion, extra: st.extra, margen: 6, tam: 400 });
  const canvas = document.createElement('canvas');
  canvas.width = LADO; canvas.height = LADO;
  const ctx = canvas.getContext('2d');
  if (img) conContorno(ctx, img, 64, 6, 384, 384, 9);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ajustar(ctx, st.frase, LADO - 56);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeText(st.frase, LADO / 2, 446);
  ctx.fillStyle = '#3B2314';
  ctx.fillText(st.frase, LADO / 2, 446);
  return canvas;
}

function aBlob(canvas) {
  return new Promise(r => canvas.toBlob(r, 'image/png'));
}

export function renderStickers(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  const cfg = michiDe(gato);
  const nombreBase = (gato.nombre || 'michi').toLowerCase().replace(/[^a-z0-9ñ]+/gi, '-');

  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow">Pack de stickers</p>
      <h1>Stickers de ${esc(gato.nombre)}</h1>
      <p class="muted">Toca un sticker para guardarlo o compartirlo. ${gato.michi ? '' : '¿Aún no lo dibujas? <a href="#/michi">Crea tu michi</a> y los stickers se verán como él.'}</p>
    </div>
    <div class="stickers" id="stickers">${STICKERS.map(s => `<button type="button" class="sticker" data-id="${s.id}" aria-label="Sticker: ${esc(s.frase)}"><span class="sticker__cargando">…</span></button>`).join('')}</div>
    <div class="pila" style="margin-bottom:16px">
      <button class="btn btn--primario btn--bloque" type="button" id="todos">📤 Compartir los 8 stickers</button>
      <a class="btn btn--secundario btn--bloque" href="#/michi">🎨 Cambiar mi michi</a>
    </div>
    <section class="tarjeta tarjeta--suave">
      <h2>Cómo usarlos en WhatsApp</h2>
      <ol class="pasos-lista">
        <li>Toca <b>"Compartir los 8 stickers"</b> y elige <b>Guardar imágenes</b> (iPhone) o guárdalos en tu galería (Android). También puedes guardarlos de a uno.</li>
        <li>En WhatsApp, abre cualquier chat y toca el ícono de <b>stickers</b> 🙂 (al lado de donde escribes).</li>
        <li>Toca <b>"Crear"</b> o el botón <b>+</b> y elige la imagen del sticker desde tu galería.</li>
        <li>Toca <b>Enviar</b>. ¡Listo! Queda guardado en tus stickers para usarlo cuando quieras.</li>
      </ol>
      <p class="muted" style="margin:0">Si tu WhatsApp no tiene el botón "Crear", actualiza la app. También puedes enviarlos como imagen normal.</p>
    </section>
  `;

  const lienzos = {};
  const caja = el.querySelector('#stickers');

  (async () => {
    for (const st of STICKERS) {
      const canvas = await dibujarSticker(cfg, st);
      lienzos[st.id] = canvas;
      const b = caja.querySelector(`[data-id="${st.id}"]`);
      if (b) b.innerHTML = `<img src="${canvas.toDataURL('image/png')}" alt="${esc(st.frase)}">`;
    }
  })();

  caja.addEventListener('click', async e => {
    const b = e.target.closest('[data-id]');
    if (!b || !lienzos[b.dataset.id]) return;
    const st = STICKERS.find(s => s.id === b.dataset.id);
    const blob = await aBlob(lienzos[st.id]);
    const r = await compartirODescargar(blob, `sticker-${nombreBase}-${st.id}.png`, st.frase, '');
    if (r === 'descargado') toast('Sticker guardado ⬇️');
  });

  el.querySelector('#todos').addEventListener('click', async () => {
    if (Object.keys(lienzos).length < STICKERS.length) { toast('Espera un segundo, se están dibujando…'); return; }
    const archivos = [];
    for (const st of STICKERS) {
      const blob = await aBlob(lienzos[st.id]);
      archivos.push(new File([blob], `sticker-${nombreBase}-${st.id}.png`, { type: 'image/png' }));
    }
    try {
      if (navigator.canShare && navigator.canShare({ files: archivos })) {
        await navigator.share({ files: archivos, title: `Stickers de ${gato.nombre}` });
        return;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
    archivos.forEach((f, i) => setTimeout(() => descargar(f, f.name), i * 350));
    toast('Descargando los 8 stickers ⬇️', 3500);
  });
}
