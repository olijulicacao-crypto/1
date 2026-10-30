// Perfil del gato: crear, editar, cambiar entre gatos y borrar.
import { esc, achicarFoto, toast, abrirModal, cerrarModal, edadTexto, fechaLarga, hoyISO } from './util.js';
import { datos, gatoActivo, guardarGato, borrarGato, elegirGato } from './datos.js';
import { michiSVG, michiDe } from './michi.js';

// Carita dibujada para cuando el gato todavía no tiene foto.
export const CARITA = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#FFE6D1"/>
  <path d="M28 46 L34 18 L52 36 Z M92 46 L86 18 L68 36 Z" fill="#FF9A4D"/>
  <ellipse cx="60" cy="66" rx="36" ry="32" fill="#FF9A4D"/>
  <circle cx="47" cy="62" r="5" fill="#3B2314"/><circle cx="73" cy="62" r="5" fill="#3B2314"/>
  <path d="M56 74 h8 l-4 5 z" fill="#E85500"/><path d="M60 79 q-6 7 -12 2 M60 79 q6 7 12 2" stroke="#3B2314" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M30 72 h-14 M30 78 h-12 M90 72 h14 M90 78 h12" stroke="#3B2314" stroke-width="2" stroke-linecap="round"/></svg>`);

// Sin foto, se muestra su michi dibujado.
export function fotoDe(gato) {
  if (!gato) return CARITA;
  if (gato.foto) return gato.foto;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(michiSVG(michiDe(gato), { margen: 14, fondo: '#FFE6D1' }));
}

export function avatar(gato, clase = 'avatar--l') {
  return `<img class="avatar ${clase}" src="${esc(fotoDe(gato))}" alt="${gato ? 'Foto de ' + esc(gato.nombre) : ''}">`;
}

const SEXOS = ['', 'Macho', 'Hembra'];
const SINO = ['', 'Sí', 'No'];

function opciones(lista, actual, vacio = 'Elegir…') {
  return lista.map(v => `<option value="${esc(v)}" ${v === (actual || '') ? 'selected' : ''}>${v ? esc(v) : vacio}</option>`).join('');
}

export function renderGato(el, ruta) {
  const nuevo = ruta === 'gato/nuevo' || !gatoActivo();
  const g = nuevo ? { nombre: '', foto: '', nacimiento: '', sexo: '', peso: '', color: '', senas: '', chip: '', esterilizado: '' } : Object.assign({}, gatoActivo());
  const d = datos();

  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow">${nuevo ? 'Nuevo integrante' : 'Perfil'}</p>
      <h1>${nuevo ? 'Cuéntanos de tu michi' : esc(g.nombre)}</h1>
      ${nuevo ? '<p class="muted">Solo el nombre es obligatorio. Puedes completar el resto cuando quieras.</p>' : `<p class="muted">${esc([g.sexo, edadTexto(g.nacimiento), g.peso ? g.peso + ' kg' : ''].filter(Boolean).join(' · ')) || 'Completa sus datos para el carnet y el afiche.'}</p>`}
    </div>

    <form class="tarjeta" id="formGato" novalidate>
      <div class="foto-editor">
        <img class="avatar avatar--xl" id="fotoVista" src="${esc(fotoDe(g))}" alt="">
        <div class="foto-editor__acciones">
          <label class="btn btn--secundario btn--chico subir">📷 ${g.foto ? 'Cambiar foto' : 'Agregar foto'}
            <input type="file" accept="image/*" id="fotoInput" aria-label="Elegir foto del gato">
          </label>
          <button type="button" class="btn btn--texto btn--chico" id="quitarFoto" ${g.foto ? '' : 'hidden'}>Quitar foto</button>
          <small class="muted">Una foto de frente y con buena luz sirve mucho para el afiche.</small>
        </div>
      </div>

      <label class="campo"><span>Nombre *</span>
        <input name="nombre" value="${esc(g.nombre)}" maxlength="30" autocomplete="off" placeholder="Ej: Oliver" required>
      </label>
      <div class="dos-col">
        <label class="campo"><span>Fecha de nacimiento</span>
          <input type="date" name="nacimiento" value="${esc(g.nacimiento)}" max="${hoyISO()}">
          <small>Si no la sabes, pon una aproximada.</small>
        </label>
        <label class="campo"><span>Peso (kg)</span>
          <input name="peso" value="${esc(g.peso)}" inputmode="decimal" maxlength="5" placeholder="Ej: 4,2">
        </label>
      </div>
      <div class="dos-col">
        <label class="campo"><span>Sexo</span><select name="sexo">${opciones(SEXOS, g.sexo)}</select></label>
        <label class="campo"><span>Esterilizado</span><select name="esterilizado">${opciones(SINO, g.esterilizado)}</select></label>
      </div>
      <label class="campo"><span>Color del pelaje</span>
        <input name="color" value="${esc(g.color)}" maxlength="60" placeholder="Ej: naranjo atigrado">
      </label>
      <label class="campo"><span>Señas particulares</span>
        <textarea name="senas" maxlength="220" placeholder="Ej: mancha blanca en el pecho, ojos verdes, collar rojo">${esc(g.senas)}</textarea>
        <small>Esto aparece en el afiche si se pierde. Mientras más detalle, mejor.</small>
      </label>
      <label class="campo"><span>N° de microchip (opcional)</span>
        <input name="chip" value="${esc(g.chip)}" inputmode="numeric" maxlength="20" placeholder="15 dígitos">
      </label>

      <h3 style="margin-top:6px">Tus datos de contacto</h3>
      <p class="muted">Se usan en el carnet y en el afiche de gato perdido. Quedan solo en tu teléfono.</p>
      <div class="dos-col">
        <label class="campo"><span>Tu nombre</span><input name="duenoNombre" value="${esc(d.dueno.nombre)}" maxlength="40" autocomplete="given-name" placeholder="Ej: Camila"></label>
        <label class="campo"><span>Tu teléfono</span><input name="duenoTelefono" value="${esc(d.dueno.telefono)}" type="tel" maxlength="20" autocomplete="tel" placeholder="+56 9 1234 5678"></label>
      </div>

      <button class="btn btn--primario btn--bloque" type="submit">${nuevo ? 'Crear perfil' : 'Guardar cambios'}</button>
    </form>

    ${nuevo ? '' : `
    <div class="pila no-imprimir">
      <a class="btn btn--secundario btn--bloque" href="#/michi">🎨 Crear su versión dibujada</a>
      <a class="btn btn--secundario btn--bloque" href="#/gato/nuevo">➕ Agregar otro gato</a>
      <button class="btn btn--peligro btn--bloque" type="button" id="borrarGato">Borrar el perfil de ${esc(g.nombre)}</button>
    </div>`}
  `;

  const form = el.querySelector('#formGato');
  const vista = el.querySelector('#fotoVista');
  const quitar = el.querySelector('#quitarFoto');

  el.querySelector('#fotoInput').addEventListener('change', async e => {
    const archivo = e.target.files && e.target.files[0];
    if (!archivo) return;
    try {
      g.foto = await achicarFoto(archivo, 720);
      vista.src = g.foto;
      quitar.hidden = false;
    } catch (err) {
      toast('No pudimos leer esa foto. Prueba con otra.');
    }
    e.target.value = '';
  });

  quitar.addEventListener('click', () => {
    g.foto = '';
    vista.src = fotoDe(g);
    quitar.hidden = true;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const nombre = String(f.get('nombre') || '').trim();
    if (!nombre) {
      toast('Ponle un nombre a tu michi 🐾');
      form.nombre.focus();
      return;
    }
    Object.assign(g, {
      nombre,
      nacimiento: f.get('nacimiento') || '',
      peso: String(f.get('peso') || '').trim().replace('.', ','),
      sexo: f.get('sexo') || '',
      esterilizado: f.get('esterilizado') || '',
      color: String(f.get('color') || '').trim(),
      senas: String(f.get('senas') || '').trim(),
      chip: String(f.get('chip') || '').trim()
    });
    d.dueno.nombre = String(f.get('duenoNombre') || '').trim();
    d.dueno.telefono = String(f.get('duenoTelefono') || '').trim();
    if (!guardarGato(g)) {
      toast('No hay espacio en el teléfono. Prueba con una foto más liviana.', 4000);
      return;
    }
    toast(nuevo ? `¡Bienvenido al club, ${nombre}! 🎉` : 'Cambios guardados ✓');
    location.hash = '#/';
  });

  const borrar = el.querySelector('#borrarGato');
  if (borrar) borrar.addEventListener('click', () => {
    if (!confirm(`¿Seguro que quieres borrar a ${g.nombre} y todo su carnet de salud? Esto no se puede deshacer.`)) return;
    borrarGato(g.id);
    toast('Perfil borrado');
    location.hash = '#/';
  });
}

// Ventana para cambiar de gato (si hay más de uno).
export function elegirGatoModal(alCambiar) {
  const d = datos();
  const activo = gatoActivo();
  abrirModal(d.gatos.length > 1 ? 'Mis gatos' : 'Mi gato', `
    <div class="lista-gatos">
      ${d.gatos.map(g => `<button type="button" data-id="${esc(g.id)}" class="${activo && activo.id === g.id ? 'activo' : ''}">${avatar(g, 'mini')}<span>${esc(g.nombre)}</span></button>`).join('')}
    </div>
    <div class="pila">
      <a class="btn btn--secundario btn--bloque" href="#/gato" data-cerrar>✏️ Editar perfil de ${esc(activo ? activo.nombre : '')}</a>
      <a class="btn btn--secundario btn--bloque" href="#/gato/nuevo" data-cerrar>➕ Agregar otro gato</a>
    </div>
  `, cuerpo => {
    cuerpo.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
      elegirGato(b.dataset.id);
      cerrarModal();
      alCambiar();
    }));
    cuerpo.querySelectorAll('[data-cerrar]').forEach(a => a.addEventListener('click', cerrarModal));
  });
}

export function resumenGato(g) {
  return [g.sexo, edadTexto(g.nacimiento), g.peso ? g.peso + ' kg' : '', g.color].filter(Boolean);
}

export function nacimientoTexto(g) {
  if (!g.nacimiento) return '—';
  const e = edadTexto(g.nacimiento);
  return fechaLarga(g.nacimiento) + (e ? ` (${e})` : '');
}

