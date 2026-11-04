// Diario de aventuras, pasaporte de explorador (sellos) y tarjeta resumen del mes.
import { esc, hoyISO, fechaLarga, nombreMes, toast, abrirModal, cerrarModal, achicarFoto, cargarImagen, esperarFuentes, compartirODescargar } from './util.js';
import { gatoActivo, paseosDe, guardarPaseo, borrarPaseo } from './datos.js';
import { michiDe, michiImagen } from './michi.js';

export const LUGARES = {
  parque: '🌳 Parque', ciudad: '🏙️ Ciudad', veterinario: '🩺 Veterinario', playa: '🏖️ Playa',
  montana: '⛰️ Montaña', viaje: '🚗 Viaje', visita: '🏡 Visita', otro: '📍 Otro'
};
export const CLIMAS = { sol: '☀️ Soleado', nublado: '⛅ Nublado', lluvia: '🌧️ Lluvia', frio: '❄️ Frío', viento: '💨 Viento' };

/* ---------- Sellos del pasaporte ---------- */
const contar = (ps, f) => ps.filter(f).length;
const diaSemana = iso => new Date(iso + 'T12:00:00').getDay();
const mesDe = iso => (iso || '').slice(0, 7);

export const SELLOS = [
  { id: 'primer', nombre: 'Primer paseo', icono: '🐾', color: '#E85500', meta: 1, valor: ps => ps.length, pista: 'Anota tu primer paseo' },
  { id: 'cinco', nombre: '5 paseos', icono: '⭐', color: '#F2994A', meta: 5, valor: ps => ps.length, pista: 'Llega a 5 paseos' },
  { id: 'diez', nombre: '10 paseos', icono: '🌟', color: '#E8A317', meta: 10, valor: ps => ps.length, pista: 'Llega a 10 paseos' },
  { id: 'veinticinco', nombre: 'Leyenda felina', icono: '🏆', color: '#C27C0E', meta: 25, valor: ps => ps.length, pista: 'Llega a 25 paseos' },
  { id: 'lluvia', nombre: 'Explorador de lluvia', icono: '🌧️', color: '#56A3E8', meta: 1, valor: ps => contar(ps, p => p.clima === 'lluvia'), pista: 'Un paseo con lluvia' },
  { id: 'frio', nombre: 'Michi invernal', icono: '❄️', color: '#7FB3D5', meta: 1, valor: ps => contar(ps, p => p.clima === 'frio' || ['06', '07', '08'].includes((p.fecha || '').slice(5, 7))), pista: 'Un paseo con frío o en invierno' },
  { id: 'sol', nombre: 'Amante del sol', icono: '☀️', color: '#FFC04D', meta: 3, valor: ps => contar(ps, p => p.clima === 'sol'), pista: '3 paseos con sol' },
  { id: 'parques', nombre: 'Rey del parque', icono: '🌳', color: '#4E9F3D', meta: 3, valor: ps => contar(ps, p => p.tipo === 'parque'), pista: '3 paseos al parque' },
  { id: 'vet', nombre: 'Valiente en el veterinario', icono: '🩺', color: '#2BB3A3', meta: 1, valor: ps => contar(ps, p => p.tipo === 'veterinario'), pista: 'Ir al veterinario en la mochila' },
  { id: 'playa', nombre: 'Vista al mar', icono: '🏖️', color: '#3FA7D6', meta: 1, valor: ps => contar(ps, p => p.tipo === 'playa'), pista: 'Un paseo a la playa' },
  { id: 'montana', nombre: 'Cumbre felina', icono: '⛰️', color: '#8B5A3C', meta: 1, valor: ps => contar(ps, p => p.tipo === 'montana'), pista: 'Un paseo a la montaña' },
  { id: 'viaje', nombre: 'Gato viajero', icono: '🚗', color: '#6E7B8B', meta: 1, valor: ps => contar(ps, p => p.tipo === 'viaje'), pista: 'Un viaje juntos' },
  { id: 'fotografo', nombre: 'Michi modelo', icono: '📸', color: '#E8A3C4', meta: 5, valor: ps => contar(ps, p => !!p.foto), pista: '5 paseos con foto' },
  { id: 'finde', nombre: 'Panorama de finde', icono: '🎉', color: '#D93A3A', meta: 1, valor: ps => contar(ps, p => p.fecha && [0, 6].includes(diaSemana(p.fecha))), pista: 'Un paseo un sábado o domingo' },
  { id: 'mes', nombre: 'Mes aventurero', icono: '📅', color: '#1F2A4D', meta: 4, valor: ps => { const m = {}; ps.forEach(p => { const k = mesDe(p.fecha); m[k] = (m[k] || 0) + 1; }); return Math.max(0, ...Object.values(m)); }, pista: '4 paseos en un mismo mes' },
  { id: 'lugares', nombre: 'Trotamundos', icono: '🗺️', color: '#9B59B6', meta: 5, valor: ps => new Set(ps.map(p => (p.lugar || '').trim().toLowerCase()).filter(Boolean)).size, pista: '5 lugares distintos' }
];

export function estadoSellos(ps) {
  return SELLOS.map(s => {
    const v = s.valor(ps);
    return { ...s, actual: Math.min(v, s.meta), ok: v >= s.meta };
  });
}

export function sellosGanados(gatoId) {
  return estadoSellos(paseosDe(gatoId)).filter(s => s.ok).length;
}

function selloHTML(s) {
  return `<div class="sello ${s.ok ? 'sello--ok' : ''}" style="--c:${s.color}">
    <div class="sello__circulo"><span>${s.icono}</span></div>
    <b>${esc(s.nombre)}</b>
    <small>${s.ok ? '¡Desbloqueado!' : s.meta > 1 ? `${s.actual} de ${s.meta}` : esc(s.pista)}</small>
  </div>`;
}

function celebrar(nuevos) {
  if (!nuevos.length) return;
  abrirModal(nuevos.length === 1 ? '¡Nuevo sello!' : '¡Nuevos sellos!', `
    <div class="sellos sellos--celebrar">${nuevos.map(selloHTML).join('')}</div>
    <a class="btn btn--primario btn--bloque" href="#/pasaporte" id="verPasaporte">Ver mi pasaporte</a>
  `, cuerpo => cuerpo.querySelector('#verPasaporte').addEventListener('click', cerrarModal));
}

/* ---------- Formulario de paseo ---------- */
function opciones(lista, actual) {
  return Object.entries(lista).map(([k, v]) => `<option value="${k}" ${k === actual ? 'selected' : ''}>${esc(v)}</option>`).join('');
}

function modalPaseo(gato, paseo, alGuardar) {
  const nuevo = !paseo;
  const p = paseo ? Object.assign({}, paseo) : { gatoId: gato.id, fecha: hoyISO(), lugar: '', tipo: 'parque', clima: 'sol', nota: '', foto: '' };
  abrirModal(nuevo ? 'Anotar paseo' : 'Editar paseo', `
    <form id="formPaseo" novalidate>
      <div class="dos-col">
        <label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${esc(p.fecha)}" max="${hoyISO()}"></label>
        <label class="campo"><span>Tipo de lugar</span><select name="tipo">${opciones(LUGARES, p.tipo)}</select></label>
      </div>
      <label class="campo"><span>¿Dónde fueron?</span><input name="lugar" value="${esc(p.lugar)}" maxlength="50" placeholder="Ej: Parque Bicentenario"></label>
      <label class="campo"><span>¿Cómo estaba el día?</span><select name="clima">${opciones(CLIMAS, p.clima)}</select></label>
      <label class="campo"><span>Nota</span><textarea name="nota" maxlength="240" placeholder="Ej: miró las palomas todo el rato 😹">${esc(p.nota)}</textarea></label>
      <div class="foto-paseo">
        <img id="fotoPaseo" src="${esc(p.foto)}" alt="" ${p.foto ? '' : 'hidden'}>
        <label class="btn btn--secundario btn--chico subir">📷 ${p.foto ? 'Cambiar foto' : 'Agregar foto (opcional)'}<input type="file" accept="image/*" id="fotoPaseoInput"></label>
        <button type="button" class="btn btn--texto btn--chico" id="quitarFotoPaseo" ${p.foto ? '' : 'hidden'}>Quitar</button>
      </div>
      <button class="btn btn--primario btn--bloque" type="submit">Guardar paseo</button>
      ${nuevo ? '' : '<button class="btn btn--texto btn--bloque" type="button" id="borrarPaseo" style="color:var(--rojo);margin-top:6px">Borrar este paseo</button>'}
    </form>
  `, cuerpo => {
    const form = cuerpo.querySelector('#formPaseo');
    const img = cuerpo.querySelector('#fotoPaseo');
    const quitar = cuerpo.querySelector('#quitarFotoPaseo');
    cuerpo.querySelector('#fotoPaseoInput').addEventListener('change', async e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        p.foto = await achicarFoto(f, 720, 0.7);
        img.src = p.foto; img.hidden = false; quitar.hidden = false;
      } catch (err) { toast('No pudimos leer esa foto.'); }
    });
    quitar.addEventListener('click', () => { p.foto = ''; img.hidden = true; quitar.hidden = true; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      Object.assign(p, {
        fecha: f.get('fecha') || hoyISO(), tipo: f.get('tipo'), clima: f.get('clima'),
        lugar: String(f.get('lugar') || '').trim(), nota: String(f.get('nota') || '').trim()
      });
      const antes = estadoSellos(paseosDe(gato.id)).filter(s => s.ok).map(s => s.id);
      if (!guardarPaseo(p)) {
        toast(p.foto ? 'El teléfono está sin espacio. Prueba sin foto o guarda un respaldo y borra fotos antiguas.' : 'No hay espacio en el teléfono para guardar.', 5000);
        return;
      }
      cerrarModal();
      toast('Paseo guardado 🐾');
      const nuevos = estadoSellos(paseosDe(gato.id)).filter(s => s.ok && !antes.includes(s.id));
      alGuardar();
      if (nuevos.length) setTimeout(() => celebrar(nuevos), 300);
    });
    const borrar = cuerpo.querySelector('#borrarPaseo');
    if (borrar) borrar.addEventListener('click', () => {
      if (!confirm('¿Borrar este paseo?')) return;
      borrarPaseo(p.id);
      cerrarModal();
      toast('Paseo borrado');
      alGuardar();
    });
  });
}

export function abrirNuevoPaseo(gato, alGuardar) {
  modalPaseo(gato, null, alGuardar);
}

/* ---------- Tarjeta resumen del mes (para Instagram) ---------- */
function redondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function dibujarTarjetaMes(gato, clave, lista) {
  await esperarFuentes();
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const [anio, mes] = clave.split('-').map(Number);
  const nombre = nombreMes(mes);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#FF9A4D'); g.addColorStop(1, '#E85500');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc((i * 233) % W, (i * 397) % H, 30 + (i % 4) * 22, 0, Math.PI * 2); ctx.fill(); }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFF7EF';
  ctx.font = '700 46px "Nunito Sans", Arial, sans-serif';
  ctx.fillText(`Las aventuras de ${gato.nombre}`.toUpperCase(), W / 2, 110, W - 120);
  ctx.font = '800 92px Poppins, "Arial Black", sans-serif';
  ctx.fillText(`${nombre.charAt(0).toUpperCase() + nombre.slice(1)} ${anio}`, W / 2, 210, W - 100);

  // Número grande
  ctx.fillStyle = '#FFFFFF';
  redondeado(ctx, W / 2 - 250, 250, 500, 150, 75); ctx.fill();
  ctx.fillStyle = '#3B2314';
  ctx.font = '800 96px Poppins, "Arial Black", sans-serif';
  ctx.fillText(`${lista.length} ${lista.length === 1 ? 'paseo' : 'paseos'}`, W / 2, 360);

  // Fotos (hasta 3) o el michi solo
  const fotos = lista.filter(p => p.foto).slice(0, 3);
  const michi = await michiImagen(Object.assign({}, michiDe(gato), { accesorio: 'mochila' }), { expresion: 'feliz', tam: 600, margen: 6 });
  if (fotos.length) {
    const imgs = (await Promise.all(fotos.map(f => cargarImagen(f.foto)))).filter(Boolean);
    const n = imgs.length, ancho = 300, gap = 30, x0 = (W - (n * ancho + (n - 1) * gap)) / 2;
    imgs.forEach((im, i) => {
      const x = x0 + i * (ancho + gap), y = 450 + (i % 2) * 30, ang = (i - (n - 1) / 2) * 0.06;
      ctx.save(); ctx.translate(x + ancho / 2, y + 190); ctx.rotate(ang);
      ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 24;
      ctx.fillRect(-ancho / 2 - 14, -190, ancho + 28, 380); ctx.shadowBlur = 0;
      const lado = Math.min(im.width, im.height);
      ctx.drawImage(im, (im.width - lado) / 2, (im.height - lado) / 2, lado, lado, -ancho / 2, -176, ancho, ancho);
      ctx.restore();
    });
    if (michi) ctx.drawImage(michi, W / 2 - 170, 860, 340, 340);
  } else if (michi) {
    ctx.drawImage(michi, W / 2 - 300, 430, 600, 600);
  }

  // Datos del mes
  const lugares = new Set(lista.map(p => (p.lugar || '').trim().toLowerCase()).filter(Boolean)).size;
  const soles = lista.filter(p => p.clima === 'sol').length;
  const datosMes = [lugares ? `📍 ${lugares} ${lugares === 1 ? 'lugar' : 'lugares'}` : '', soles ? `☀️ ${soles} con sol` : '', lista.some(p => p.clima === 'lluvia') ? '🌧️ Con lluvia' : ''].filter(Boolean);
  ctx.font = '700 40px "Nunito Sans", Arial, sans-serif';
  ctx.fillStyle = '#FFF7EF';
  if (datosMes.length) ctx.fillText(datosMes.join('   '), W / 2, fotos.length ? 1238 : 1110, W - 100);

  ctx.fillStyle = '#3B2314';
  ctx.fillRect(0, H - 76, W, 76);
  ctx.fillStyle = '#FFF7EF';
  ctx.font = '700 32px "Nunito Sans", Arial, sans-serif';
  ctx.fillText('Club OliJuli · Explorando el mundo juntos', W / 2, H - 26);
  return c;
}

/* ---------- Vistas ---------- */
function tabsAventuras(activa) {
  return `<div class="segmentos segmentos--grande" role="tablist">
    <a href="#/aventuras" class="${activa === 'diario' ? 'activo' : ''}">📔 Diario</a>
    <a href="#/pasaporte" class="${activa === 'pasaporte' ? 'activo' : ''}">🛂 Pasaporte</a>
  </div>`;
}

export function renderDiario(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  const ps = paseosDe(gato.id).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const meses = new Map();
  ps.forEach(p => { const k = mesDe(p.fecha); if (!meses.has(k)) meses.set(k, []); meses.get(k).push(p); });

  el.innerHTML = `
    <div class="cabecera"><p class="eyebrow">Diario de aventuras</p><h1>Aventuras de ${esc(gato.nombre)}</h1></div>
    ${tabsAventuras('diario')}
    <button class="btn btn--primario btn--bloque" type="button" id="nuevoPaseo" style="margin-bottom:16px">➕ Anotar paseo</button>
    ${ps.length ? [...meses.entries()].map(([k, lista]) => {
      const [a, m] = k.split('-').map(Number);
      return `<section class="tarjeta">
        <div class="fila fila--entre fila--wrap" style="margin-bottom:6px">
          <h2 style="margin:0">${esc(nombreMes(m).replace(/^./, x => x.toUpperCase()))} ${a} <span class="muted">· ${lista.length} ${lista.length === 1 ? 'paseo' : 'paseos'}</span></h2>
          <button class="btn btn--secundario btn--chico" type="button" data-tarjeta="${k}">🖼️ Tarjeta del mes</button>
        </div>
        ${lista.map(p => `<button type="button" class="paseo" data-paseo="${esc(p.id)}">
          ${p.foto ? `<img src="${esc(p.foto)}" alt="">` : `<span class="paseo__icono">${esc((LUGARES[p.tipo] || LUGARES.otro).split(' ')[0])}</span>`}
          <span class="paseo__texto">
            <b>${esc(p.lugar || (LUGARES[p.tipo] || LUGARES.otro).replace(/^\S+\s/, ''))}</b>
            <span class="muted">${esc(fechaLarga(p.fecha))} · ${esc((CLIMAS[p.clima] || '').split(' ')[0])}</span>
            ${p.nota ? `<span class="paseo__nota">${esc(p.nota)}</span>` : ''}
          </span>
        </button>`).join('')}
      </section>`;
    }).join('') : `<div class="tarjeta vacio"><span>🎒</span><p>Cada vez que salgan juntos, anótalo aquí. Cada mes te armamos una tarjeta para compartir y vas ganando sellos en tu pasaporte.</p></div>`}
  `;

  const recargar = () => renderDiario(el);
  el.querySelector('#nuevoPaseo').addEventListener('click', () => modalPaseo(gato, null, recargar));
  el.querySelectorAll('[data-paseo]').forEach(b => b.addEventListener('click', () => {
    const p = ps.find(x => x.id === b.dataset.paseo);
    if (p) modalPaseo(gato, p, recargar);
  }));
  el.querySelectorAll('[data-tarjeta]').forEach(b => b.addEventListener('click', async () => {
    const k = b.dataset.tarjeta;
    b.disabled = true;
    const canvas = await dibujarTarjetaMes(gato, k, meses.get(k));
    b.disabled = false;
    const url = canvas.toDataURL('image/jpeg', 0.9);
    abrirModal('Tarjeta del mes', `
      <img src="${url}" alt="Tarjeta de aventuras del mes" style="border-radius:16px;box-shadow:var(--sombra);margin-bottom:14px">
      <button class="btn btn--primario btn--bloque" type="button" id="compartirTarjeta">📤 Compartir en Instagram o WhatsApp</button>
    `, cuerpo => cuerpo.querySelector('#compartirTarjeta').addEventListener('click', () => {
      canvas.toBlob(async blob => {
        const r = await compartirODescargar(blob, `aventuras-${gato.nombre.toLowerCase().replace(/[^a-z0-9ñ]+/gi, '-')}-${k}.jpg`, 'Aventuras del mes', `Las aventuras de ${gato.nombre} 🐾 #ClubOliJuli`);
        if (r === 'descargado') toast('Tarjeta descargada ⬇️');
      }, 'image/jpeg', 0.92);
    }));
  }));
}

export function renderPasaporte(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  const est = estadoSellos(paseosDe(gato.id));
  const ganados = est.filter(s => s.ok).length;
  el.innerHTML = `
    <div class="cabecera"><p class="eyebrow">Pasaporte de explorador</p><h1>Pasaporte de ${esc(gato.nombre)}</h1></div>
    ${tabsAventuras('pasaporte')}
    <section class="tarjeta pasaporte-resumen">
      <div><b>${ganados}</b> de ${est.length} sellos</div>
      <div class="barra-progreso"><span style="width:${Math.round(ganados / est.length * 100)}%"></span></div>
      <p class="muted" style="margin:8px 0 0">Los sellos se desbloquean solos al anotar paseos en el diario.</p>
    </section>
    <div class="sellos">${est.sort((a, b) => b.ok - a.ok).map(selloHTML).join('')}</div>
  `;
}
