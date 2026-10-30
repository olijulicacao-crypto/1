// Carnet de salud: registros, recordatorios (calendario .ics / Google) y carnet para mostrar en la consulta.
import { esc, fechaCorta, fechaLarga, cuandoTexto, diasHasta, hoyISO, toast, abrirModal, cerrarModal, descargar } from './util.js';
import { datos, gatoActivo, registrosDe, guardarRegistro, borrarRegistro } from './datos.js';
import { avatar, nacimientoTexto } from './gato.js';

export const TIPOS = {
  vacuna: { nombre: 'Vacuna', icono: '💉', ejemplo: 'Ej: Triple felina, antirrábica' },
  antiInterno: { nombre: 'Antiparasitario interno', icono: '💊', ejemplo: 'Ej: nombre del producto' },
  antiExterno: { nombre: 'Antiparasitario externo', icono: '🛡️', ejemplo: 'Ej: pipeta, collar' },
  bano: { nombre: 'Baño', icono: '🛁', ejemplo: 'Ej: baño en peluquería' },
  veterinario: { nombre: 'Visita al veterinario', icono: '🩺', ejemplo: 'Ej: control anual' },
  otro: { nombre: 'Otro', icono: '📌', ejemplo: 'Ej: limpieza dental' }
};

const AVISO_MEDICO = `<div class="aviso"><span>ℹ️</span><span>El Club OliJuli <b>no da consejos médicos</b>. Aquí solo guardas las fechas y datos que te indique tu veterinario.</span></div>`;

let filtro = 'todos';

function estadoDe(proxima) {
  const n = diasHasta(proxima);
  if (n === null) return '';
  if (n < 0) return `<span class="estado estado--vencido">${esc(cuandoTexto(proxima))}</span>`;
  if (n <= 14) return `<span class="estado estado--pronto">${esc(cuandoTexto(proxima))}</span>`;
  return `<span class="estado estado--ok">${esc(cuandoTexto(proxima))}</span>`;
}

function tituloRecordatorio(reg, gato) {
  const t = TIPOS[reg.tipo] || TIPOS.otro;
  return `${t.icono} ${t.nombre} de ${gato.nombre}${reg.detalle ? ': ' + reg.detalle : ''}`;
}

// Próximos recordatorios: el registro más reciente con fecha próxima de cada tipo + detalle.
export function proximos(gatoId) {
  const lista = registrosDe(gatoId).filter(r => r.proxima);
  const vistos = new Map();
  lista.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  for (const r of lista) {
    const clave = r.tipo + '|' + (r.detalle || '').toLowerCase();
    if (!vistos.has(clave)) vistos.set(clave, r);
  }
  return [...vistos.values()].filter(r => diasHasta(r.proxima) >= -60).sort((a, b) => a.proxima.localeCompare(b.proxima));
}

export function itemRecordatorio(r, gato, conAcciones = true) {
  const t = TIPOS[r.tipo] || TIPOS.otro;
  return `<div class="recordatorio">
    <div class="recordatorio__icono" aria-hidden="true">${t.icono}</div>
    <div class="recordatorio__cuerpo">
      <b>${esc(t.nombre)}${r.detalle ? ' · ' + esc(r.detalle) : ''}</b>
      <span class="muted">${esc(fechaLarga(r.proxima))}</span><br>${estadoDe(r.proxima)}
      ${conAcciones ? `<div class="recordatorio__acciones">
        <button class="btn btn--secundario btn--chico" type="button" data-ics="${esc(r.id)}">📅 Agregar al calendario</button>
      </div>` : ''}
    </div>
  </div>`;
}

/* ---------- Calendario ---------- */
function icsTexto(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function plegar(linea) {
  // Las líneas de un .ics no deben pasar de 75 caracteres.
  const out = [];
  let resto = linea;
  while (resto.length > 74) { out.push(resto.slice(0, 74)); resto = ' ' + resto.slice(74); }
  out.push(resto);
  return out.join('\r\n');
}

function sumarDia(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + 1));
  return f.toISOString().slice(0, 10).replace(/-/g, '');
}

export function archivoICS(reg, gato) {
  const titulo = tituloRecordatorio(reg, gato);
  const desc = `Fecha indicada por tu veterinario.${reg.lugar ? ' Lugar: ' + reg.lugar + '.' : ''}${reg.notas ? ' Notas: ' + reg.notas : ''} — Club OliJuli`;
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lineas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OliJuli//Club OliJuli//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reg.id}-${reg.proxima}@club.olijuli`,
    `DTSTAMP:${ahora}`,
    `DTSTART;VALUE=DATE:${reg.proxima.replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${sumarDia(reg.proxima)}`,
    `SUMMARY:${icsTexto(titulo)}`,
    `DESCRIPTION:${icsTexto(desc)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-PT15H', `DESCRIPTION:${icsTexto('Mañana: ' + titulo)}`, 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT9H', `DESCRIPTION:${icsTexto('Hoy: ' + titulo)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ];
  return new Blob([lineas.map(plegar).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
}

export function enlaceGoogle(reg, gato) {
  const inicio = reg.proxima.replace(/-/g, '');
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: tituloRecordatorio(reg, gato),
    dates: `${inicio}/${sumarDia(reg.proxima)}`,
    details: 'Fecha indicada por tu veterinario. — Club OliJuli'
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

export function modalCalendario(reg, gato) {
  abrirModal('Agregar al calendario', `
    <p>${esc(tituloRecordatorio(reg, gato))}<br><b>${esc(fechaLarga(reg.proxima))}</b></p>
    <p class="muted">Te avisará el día anterior a las 9:00 y el mismo día a las 9:00.</p>
    <div class="pila">
      <button class="btn btn--primario btn--bloque" type="button" id="icsDescargar">📱 Calendario del celular</button>
      <a class="btn btn--secundario btn--bloque" target="_blank" rel="noopener" href="${esc(enlaceGoogle(reg, gato))}">Google Calendar</a>
    </div>
    <p class="muted" style="margin-top:12px">En iPhone: toca "Calendario del celular" y luego <b>Agregar</b>. En Android, si no se abre solo, usa Google Calendar.</p>
  `, cuerpo => {
    cuerpo.querySelector('#icsDescargar').addEventListener('click', () => {
      const nombre = `recordatorio-${(gato.nombre || 'gato').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${reg.proxima}.ics`;
      descargar(archivoICS(reg, gato), nombre);
      toast('Abre el archivo para agregarlo a tu calendario 📅', 3500);
    });
  });
}

/* ---------- Formulario de registro ---------- */
function modalRegistro(gato, reg, alGuardar) {
  const nuevo = !reg;
  const r = reg ? Object.assign({}, reg) : { gatoId: gato.id, tipo: 'vacuna', detalle: '', fecha: hoyISO(), proxima: '', lugar: '', notas: '' };
  abrirModal(nuevo ? 'Nuevo registro' : 'Editar registro', `
    <form id="formReg" novalidate>
      <label class="campo"><span>¿Qué fue?</span>
        <select name="tipo">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${k === r.tipo ? 'selected' : ''}>${t.icono} ${esc(t.nombre)}</option>`).join('')}</select>
      </label>
      <label class="campo"><span>Detalle</span>
        <input name="detalle" value="${esc(r.detalle)}" maxlength="60" placeholder="${esc((TIPOS[r.tipo] || TIPOS.otro).ejemplo)}">
      </label>
      <div class="dos-col">
        <label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${esc(r.fecha)}"></label>
        <label class="campo"><span>Próxima fecha</span><input type="date" name="proxima" value="${esc(r.proxima)}"></label>
      </div>
      <p class="muted" style="margin-top:-6px">La <b>próxima fecha</b> es la que te indicó tu veterinario. Si no te dio una, déjala vacía.</p>
      <label class="campo"><span>Veterinario o lugar</span><input name="lugar" value="${esc(r.lugar)}" maxlength="60" placeholder="Ej: Clínica Veterinaria Ñuñoa"></label>
      <label class="campo"><span>Notas</span><textarea name="notas" maxlength="300" placeholder="Ej: peso en la consulta, lote de la vacuna">${esc(r.notas)}</textarea></label>
      <button class="btn btn--primario btn--bloque" type="submit">Guardar</button>
      ${nuevo ? '' : '<button class="btn btn--texto btn--bloque" type="button" id="borrarReg" style="color:var(--rojo);margin-top:6px">Borrar este registro</button>'}
    </form>
  `, cuerpo => {
    const form = cuerpo.querySelector('#formReg');
    form.tipo.addEventListener('change', () => { form.detalle.placeholder = (TIPOS[form.tipo.value] || TIPOS.otro).ejemplo; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      Object.assign(r, {
        tipo: f.get('tipo'), detalle: String(f.get('detalle') || '').trim(),
        fecha: f.get('fecha') || '', proxima: f.get('proxima') || '',
        lugar: String(f.get('lugar') || '').trim(), notas: String(f.get('notas') || '').trim()
      });
      if (!r.fecha && !r.proxima) { toast('Pon al menos una fecha'); return; }
      if (!guardarRegistro(r)) { toast('No hay espacio en el teléfono para guardar.', 4000); return; }
      cerrarModal();
      toast('Guardado en el carnet ✓');
      alGuardar(r);
    });
    const borrar = cuerpo.querySelector('#borrarReg');
    if (borrar) borrar.addEventListener('click', () => {
      if (!confirm('¿Borrar este registro?')) return;
      borrarRegistro(r.id);
      cerrarModal();
      toast('Registro borrado');
      alGuardar(null);
    });
  });
}

export function conectarCalendario(el, gato) {
  el.querySelectorAll('[data-ics]').forEach(b => b.addEventListener('click', () => {
    const reg = datos().salud.find(x => x.id === b.dataset.ics);
    if (reg) modalCalendario(reg, gato);
  }));
}

/* ---------- Vista Salud ---------- */
export function renderSalud(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  const regs = registrosDe(gato.id).slice().sort((a, b) => (b.fecha || b.proxima || '').localeCompare(a.fecha || a.proxima || ''));
  const prox = proximos(gato.id);
  const visibles = filtro === 'todos' ? regs : regs.filter(r => r.tipo === filtro);

  el.innerHTML = `
    <div class="cabecera fila fila--entre">
      <div><p class="eyebrow">Carnet de salud</p><h1>Salud de ${esc(gato.nombre)}</h1></div>
    </div>
    <div class="pila" style="margin-bottom:16px">
      <button class="btn btn--primario btn--bloque" type="button" id="agregar">➕ Agregar registro de salud</button>
      <a class="btn btn--secundario btn--bloque" href="#/carnet">🪪 Ver carnet para la consulta</a>
    </div>

    <section class="tarjeta">
      <h2>Próximos recordatorios</h2>
      ${prox.length ? prox.map(r => itemRecordatorio(r, gato)).join('') : `<div class="vacio"><span>📅</span>Cuando agregues un registro con "próxima fecha", aparecerá aquí con su recordatorio.</div>`}
    </section>

    <section class="tarjeta">
      <h2>Historial</h2>
      <div class="segmentos" role="group" aria-label="Filtrar">
        <button type="button" data-f="todos" class="${filtro === 'todos' ? 'activo' : ''}">Todos</button>
        ${Object.entries(TIPOS).map(([k, t]) => `<button type="button" data-f="${k}" class="${filtro === k ? 'activo' : ''}">${t.icono} ${esc(t.nombre.replace('Antiparasitario', 'Antipar.').replace('Visita al veterinario', 'Veterinario'))}</button>`).join('')}
      </div>
      ${visibles.length ? visibles.map(r => {
        const t = TIPOS[r.tipo] || TIPOS.otro;
        return `<div class="recordatorio">
          <div class="recordatorio__icono" aria-hidden="true">${t.icono}</div>
          <div class="recordatorio__cuerpo">
            <b>${esc(t.nombre)}${r.detalle ? ' · ' + esc(r.detalle) : ''}</b>
            <span class="muted">${r.fecha ? esc(fechaLarga(r.fecha)) : 'Sin fecha'}${r.lugar ? ' · ' + esc(r.lugar) : ''}</span>
            ${r.proxima ? `<br><span class="muted">Próxima: ${esc(fechaCorta(r.proxima))}</span>` : ''}
          </div>
          <button class="btn btn--texto btn--chico" type="button" data-editar="${esc(r.id)}">Editar</button>
        </div>`;
      }).join('') : `<div class="vacio"><span>🗂️</span>${regs.length ? 'No hay registros de este tipo.' : 'Todavía no hay registros. ¡Agrega la última vacuna de ' + esc(gato.nombre) + '!'}</div>`}
    </section>
    ${AVISO_MEDICO}
  `;

  const recargar = () => renderSalud(el);
  el.querySelector('#agregar').addEventListener('click', () => modalRegistro(gato, null, reg => {
    recargar();
    if (reg && reg.proxima && diasHasta(reg.proxima) >= 0) setTimeout(() => modalCalendario(reg, gato), 250);
  }));
  el.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { filtro = b.dataset.f; recargar(); }));
  el.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => {
    const reg = regs.find(x => x.id === b.dataset.editar);
    if (reg) modalRegistro(gato, reg, recargar);
  }));
  conectarCalendario(el, gato);
}

/* ---------- Carnet para mostrar en la consulta ---------- */
export function renderCarnet(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  const d = datos();
  const regs = registrosDe(gato.id);
  const secciones = Object.entries(TIPOS).map(([k, t]) => {
    const lista = regs.filter(r => r.tipo === k).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
    if (!lista.length) return '';
    return `<div class="carnet__seccion"><h3>${t.icono} ${esc(t.nombre)}</h3>
      <table><thead><tr><th>Fecha</th><th>Detalle</th><th>Próxima</th></tr></thead><tbody>
      ${lista.map(r => `<tr><td class="nowrap">${esc(fechaCorta(r.fecha))}</td><td>${esc(r.detalle || '—')}${r.lugar ? `<br><span class="muted">${esc(r.lugar)}</span>` : ''}</td><td class="nowrap">${esc(fechaCorta(r.proxima))}</td></tr>`).join('')}
      </tbody></table></div>`;
  }).join('');

  el.innerHTML = `
    <div class="fila fila--entre no-imprimir" style="margin-bottom:12px">
      <a class="btn btn--texto" href="#/salud">← Volver</a>
      <button class="btn btn--secundario btn--chico" type="button" id="imprimir">🖨️ Imprimir o PDF</button>
    </div>
    <article class="carnet">
      <div class="carnet__cabeza">
        <img class="logo" src="icons/icon-192.png" alt="">
        <div><h2>Carnet de salud</h2><small>Club OliJuli</small></div>
      </div>
      <div class="carnet__gato">
        ${avatar(gato, 'avatar--l')}
        <div>
          <h2 style="margin-bottom:6px">${esc(gato.nombre)}</h2>
          <dl class="carnet__datos">
            <dt>Nacimiento</dt><dd>${esc(nacimientoTexto(gato))}</dd>
            ${gato.sexo ? `<dt>Sexo</dt><dd>${esc(gato.sexo)}</dd>` : ''}
            ${gato.peso ? `<dt>Peso</dt><dd>${esc(gato.peso)} kg</dd>` : ''}
            ${gato.esterilizado ? `<dt>Esterilizado</dt><dd>${esc(gato.esterilizado)}</dd>` : ''}
            ${gato.color ? `<dt>Pelaje</dt><dd>${esc(gato.color)}</dd>` : ''}
            ${gato.chip ? `<dt>Microchip</dt><dd>${esc(gato.chip)}</dd>` : ''}
            ${d.dueno.nombre || d.dueno.telefono ? `<dt>Tutor</dt><dd>${esc([d.dueno.nombre, d.dueno.telefono].filter(Boolean).join(' · '))}</dd>` : ''}
          </dl>
        </div>
      </div>
      ${secciones || '<div class="carnet__seccion"><div class="vacio"><span>🗂️</span>Aún no hay registros en el carnet.</div></div>'}
      <div class="carnet__pie">Datos registrados por el tutor según las indicaciones de su veterinario · Actualizado el ${esc(fechaLarga(hoyISO()))}</div>
    </article>
  `;
  el.querySelector('#imprimir').addEventListener('click', () => window.print());
}
