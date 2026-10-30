// Aviso de gato perdido: afiche "SE BUSCA" dibujado con canvas, listo para compartir o descargar.
import { esc, hoyISO, fechaLarga, toast, cargarImagen, esperarFuentes, compartirODescargar, descargar } from './util.js';
import { datos, gatoActivo, guardar } from './datos.js';
import { CARITA } from './gato.js';

const ANCHO = 1080, ALTO = 1350;
const C = { naranja: '#E85500', tinta: '#3B2314', crema: '#FFF7EF', durazno: '#FFE6D1', rojo: '#C62828', blanco: '#FFFFFF' };

function redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Corta el texto en líneas que quepan en el ancho; si sobra, termina en "…".
function lineas(ctx, texto, ancho, max) {
  const palabras = String(texto || '').split(/\s+/).filter(Boolean);
  const out = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (ctx.measureText(prueba).width <= ancho) { actual = prueba; continue; }
    if (actual) out.push(actual);
    actual = p;
    if (out.length === max) break;
  }
  if (out.length < max && actual) out.push(actual);
  if (out.length > max) out.length = max;
  const usadas = out.join(' ').split(/\s+/).length;
  if (usadas < palabras.length && out.length) {
    let ultima = out[out.length - 1];
    while (ctx.measureText(ultima + '…').width > ancho && ultima.length) ultima = ultima.slice(0, -1);
    out[out.length - 1] = ultima.replace(/[\s,.;]+$/, '') + '…';
  }
  return out;
}

function ajustarFuente(ctx, texto, peso, familia, maxPx, minPx, ancho) {
  let px = maxPx;
  ctx.font = `${peso} ${px}px ${familia}`;
  while (px > minPx && ctx.measureText(texto).width > ancho) {
    px -= 4;
    ctx.font = `${peso} ${px}px ${familia}`;
  }
  return px;
}

function fotoCubriendo(ctx, img, x, y, w, h) {
  const escala = Math.max(w / img.width, h / img.height);
  const sw = w / escala, sh = h / escala;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2.6, sw, sh, x, y, w, h);
}

const TITULAR = 'Poppins, "Arial Black", sans-serif';
const TEXTO = '"Nunito Sans", Arial, sans-serif';

export async function dibujarAfiche(canvas, gato, dueno, info) {
  await esperarFuentes();
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  const M = 56;

  // Fondo
  ctx.fillStyle = C.crema;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Franja superior
  ctx.fillStyle = C.rojo;
  ctx.fillRect(0, 0, ANCHO, 230);
  ctx.fillStyle = C.blanco;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 150px ${TITULAR}`;
  ctx.fillText('SE BUSCA', ANCHO / 2, 160);
  ctx.font = `700 38px ${TEXTO}`;
  ctx.fillText(info.recompensa ? 'GATO PERDIDO · SE OFRECE RECOMPENSA' : 'GATO PERDIDO · ¿LO HAS VISTO?', ANCHO / 2, 212);

  // Foto
  const fx = M, fy = 262, fw = ANCHO - M * 2, fh = 560;
  ctx.save();
  redondeado(ctx, fx, fy, fw, fh, 36);
  ctx.fillStyle = C.durazno;
  ctx.fill();
  ctx.clip();
  const img = await cargarImagen(gato.foto || CARITA);
  if (img) {
    if (gato.foto) fotoCubriendo(ctx, img, fx, fy, fw, fh);
    else ctx.drawImage(img, fx + (fw - fh) / 2, fy, fh, fh);
  }
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = C.blanco;
  redondeado(ctx, fx, fy, fw, fh, 36);
  ctx.stroke();

  // Recompensa (sello sobre la foto)
  if (info.recompensa) {
    const texto = 'RECOMPENSA ' + info.recompensa;
    ctx.font = `800 40px ${TITULAR}`;
    const w = Math.min(ctx.measureText(texto).width + 60, fw - 40);
    ctx.fillStyle = C.naranja;
    redondeado(ctx, ANCHO - M - 24 - w, fy + 24, w, 72, 36);
    ctx.fill();
    ctx.fillStyle = C.blanco;
    ctx.textAlign = 'center';
    ajustarFuente(ctx, texto, 800, TITULAR, 40, 24, w - 40);
    ctx.fillText(texto, ANCHO - M - 24 - w / 2, fy + 74);
  }

  // Nombre
  let y = fy + fh + 100;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.tinta;
  ajustarFuente(ctx, gato.nombre.toUpperCase(), 800, TITULAR, 96, 48, ANCHO - M * 2);
  ctx.fillText(gato.nombre.toUpperCase(), ANCHO / 2, y);

  // Detalles
  const detalles = [];
  if (gato.color) detalles.push(gato.color);
  if (gato.senas) detalles.push(gato.senas);
  ctx.font = `600 36px ${TEXTO}`;
  ctx.fillStyle = C.tinta;
  y += 58;
  const limite = ALTO - 210 - 24;
  const ls = lineas(ctx, detalles.join(' · ') || 'Responde a su nombre', ANCHO - M * 2 - 20, 2);
  for (const l of ls) { ctx.fillText(l, ANCHO / 2, y); y += 46; }

  // Dónde y cuándo
  const donde = [info.zona ? 'Visto por última vez en ' + info.zona : '', info.fecha ? 'el ' + fechaLarga(info.fecha) : ''].filter(Boolean).join(', ');
  if (donde) {
    ctx.font = `700 32px ${TEXTO}`;
    ctx.fillStyle = C.naranja;
    const caben = Math.min(2, Math.floor((limite - (y + 4)) / 42) + 1);
    const ld = caben > 0 ? lineas(ctx, donde, ANCHO - M * 2 - 20, caben) : [];
    for (const l of ld) { ctx.fillText(l, ANCHO / 2, y + 4); y += 42; }
  }

  // Franja de contacto
  const by = ALTO - 210;
  ctx.fillStyle = C.tinta;
  ctx.fillRect(0, by, ANCHO, 210);
  ctx.fillStyle = C.blanco;
  ctx.font = `700 34px ${TEXTO}`;
  ctx.fillText(dueno.nombre ? `Si lo ves, avísale a ${dueno.nombre}:` : 'Si lo ves, llama o escribe:', ANCHO / 2, by + 60);
  const tel = dueno.telefono || 'Agrega tu teléfono';
  ctx.fillStyle = dueno.telefono ? C.blanco : '#FFB38A';
  ajustarFuente(ctx, tel, 800, TITULAR, 88, 44, ANCHO - M * 2);
  ctx.fillText(tel, ANCHO / 2, by + 150);
  ctx.font = `400 22px ${TEXTO}`;
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.fillText('Afiche creado con el Club OliJuli', ANCHO / 2, by + 192);
}

function textoMensaje(gato, dueno, info) {
  const partes = [`🚨 SE BUSCA: ${gato.nombre}, gato perdido.`];
  if (gato.color) partes.push(`Pelaje: ${gato.color}.`);
  if (gato.senas) partes.push(`Señas: ${gato.senas}.`);
  if (info.zona) partes.push(`Visto por última vez en ${info.zona}${info.fecha ? ' el ' + fechaLarga(info.fecha) : ''}.`);
  if (info.recompensa) partes.push(`Se ofrece recompensa: ${info.recompensa}.`);
  if (dueno.telefono) partes.push(`Si lo ves, avisa al ${dueno.telefono}${dueno.nombre ? ' (' + dueno.nombre + ')' : ''}.`);
  partes.push('¡Por favor comparte! 🙏');
  return partes.join(' ');
}

export function renderPerdido(el) {
  const gato = gatoActivo();
  if (!gato) {
    el.innerHTML = `<div class="tarjeta vacio"><span>🐾</span><p>Primero crea el perfil de tu gato con una foto. Así, si algún día se pierde, el afiche se arma en 10 segundos.</p>
      <a class="btn btn--primario" href="#/gato/nuevo">Crear perfil</a></div>`;
    return;
  }
  const d = datos();
  const info = Object.assign({ zona: '', fecha: hoyISO(), recompensa: '' }, d.perdido[gato.id] || {});
  if (!info.fecha) info.fecha = hoyISO();

  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow" style="color:var(--rojo)">Aviso de gato perdido</p>
      <h1>Afiche de ${esc(gato.nombre)}</h1>
      <p class="muted">Ya está listo con sus datos. Compártelo en WhatsApp, Instagram y grupos de vecinos.</p>
    </div>
    <div class="afiche-preview"><img id="afiche" alt="Afiche SE BUSCA de ${esc(gato.nombre)}"></div>
    <div class="pila" style="margin-bottom:16px">
      <button class="btn btn--alerta btn--bloque" type="button" id="compartir">📤 Compartir afiche</button>
      <div class="dos-col" style="gap:10px">
        <button class="btn btn--secundario" type="button" id="descargar">⬇️ Descargar</button>
        <button class="btn btn--secundario" type="button" id="copiar">💬 Copiar mensaje</button>
      </div>
    </div>

    <form class="tarjeta" id="formPerdido" novalidate>
      <h2>Completa el aviso</h2>
      <p class="muted">Todo es opcional, salvo tu teléfono. Los cambios se ven al tiro en el afiche.</p>
      <label class="campo"><span>Tu teléfono *</span><input name="telefono" type="tel" value="${esc(d.dueno.telefono)}" maxlength="20" placeholder="+56 9 1234 5678" autocomplete="tel"></label>
      <label class="campo"><span>¿Dónde lo vieron por última vez?</span><input name="zona" value="${esc(info.zona)}" maxlength="70" placeholder="Ej: Plaza Ñuñoa, cerca de Irarrázaval"></label>
      <div class="dos-col">
        <label class="campo"><span>¿Cuándo?</span><input name="fecha" type="date" value="${esc(info.fecha)}" max="${hoyISO()}"></label>
        <label class="campo"><span>Recompensa</span><input name="recompensa" value="${esc(info.recompensa)}" maxlength="20" placeholder="Ej: $50.000"></label>
      </div>
      <p class="muted">¿Falta la foto o las señas? <a href="#/gato">Edita el perfil de ${esc(gato.nombre)}</a>.</p>
    </form>

    <div class="tarjeta tarjeta--suave">
      <h3>Qué hacer ahora</h3>
      <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
        <li>Comparte el afiche en grupos de WhatsApp y de vecinos de tu comuna.</li>
        <li>Publícalo en tu Instagram y en grupos de mascotas perdidas.</li>
        <li>Recorre el sector al anochecer: es cuando los gatos se mueven más.</li>
        <li>Avisa a las veterinarias cercanas y deja el afiche impreso.</li>
      </ol>
    </div>
  `;

  const canvas = document.createElement('canvas');
  const imgEl = el.querySelector('#afiche');
  const form = el.querySelector('#formPerdido');
  let blobActual = null;
  let pendiente = null;

  async function actualizar() {
    await dibujarAfiche(canvas, gato, d.dueno, info);
    imgEl.src = canvas.toDataURL('image/jpeg', 0.85);
    blobActual = null;
  }

  function obtenerBlob() {
    if (blobActual) return Promise.resolve(blobActual);
    return new Promise(res => canvas.toBlob(b => { blobActual = b; res(b); }, 'image/png'));
  }

  form.addEventListener('input', () => {
    const f = new FormData(form);
    d.dueno.telefono = String(f.get('telefono') || '').trim();
    info.zona = String(f.get('zona') || '').trim();
    info.fecha = f.get('fecha') || '';
    info.recompensa = String(f.get('recompensa') || '').trim();
    d.perdido[gato.id] = { zona: info.zona, fecha: info.fecha, recompensa: info.recompensa };
    guardar();
    clearTimeout(pendiente);
    pendiente = setTimeout(actualizar, 350);
  });
  form.addEventListener('submit', e => e.preventDefault());

  const nombreArchivo = `se-busca-${gato.nombre.toLowerCase().replace(/[^a-z0-9ñ]+/gi, '-')}.png`;

  el.querySelector('#compartir').addEventListener('click', async () => {
    if (!d.dueno.telefono) { toast('Agrega tu teléfono para que puedan avisarte'); form.telefono.focus(); return; }
    const blob = await obtenerBlob();
    const r = await compartirODescargar(blob, nombreArchivo, `Se busca: ${gato.nombre}`, textoMensaje(gato, d.dueno, info));
    if (r === 'descargado') toast('Afiche descargado. Búscalo en tus fotos o descargas.', 3500);
  });
  el.querySelector('#descargar').addEventListener('click', async () => {
    descargar(await obtenerBlob(), nombreArchivo);
    toast('Afiche descargado ⬇️');
  });
  el.querySelector('#copiar').addEventListener('click', async () => {
    const texto = textoMensaje(gato, d.dueno, info);
    try {
      await navigator.clipboard.writeText(texto);
      toast('Mensaje copiado. Pégalo junto al afiche 💬');
    } catch (e) {
      prompt('Copia este mensaje:', texto);
    }
  });

  actualizar();
}
