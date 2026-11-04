// Ajustes: respaldo, restaurar, instalar la app y borrar datos.
import { toast, compartirODescargar, hoyISO } from './util.js';
import { datos, respaldoJSON, restaurarDesde, borrarTodo, guardadoDisponible } from './datos.js';

let eventoInstalar = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  eventoInstalar = e;
  document.querySelectorAll('[data-instalar]').forEach(b => { b.hidden = false; });
});

export function esApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function tarjetaInstalar() {
  if (esApp()) return '';
  return `<section class="tarjeta tarjeta--suave">
    <div class="instalar"><img src="icons/icon-192.png" alt=""><div><h3 style="margin:0">Instala el Club en tu celular</h3><p class="muted" style="margin:0">Queda como una app, con su ícono.</p></div></div>
    ${esIOS()
      ? '<p style="margin:12px 0 0">En Safari, toca <b>Compartir</b> <span aria-hidden="true">⬆️</span> y luego <b>"Agregar a pantalla de inicio"</b>.</p>'
      : `<button class="btn btn--primario btn--bloque" style="margin-top:12px" type="button" data-instalar ${eventoInstalar ? '' : 'hidden'}>📲 Instalar app</button>
         <p class="muted" style="margin:10px 0 0">Si no ves el botón: abre el menú del navegador (⋮) y elige <b>"Instalar app"</b> o <b>"Agregar a pantalla principal"</b>.</p>`}
  </section>`;
}

export function conectarInstalar(el) {
  el.querySelectorAll('[data-instalar]').forEach(b => b.addEventListener('click', async () => {
    if (!eventoInstalar) return;
    eventoInstalar.prompt();
    try { await eventoInstalar.userChoice; } catch (e) { /* el usuario cerró la ventana */ }
    eventoInstalar = null;
    b.hidden = true;
  }));
}

export function renderAjustes(el) {
  const d = datos();
  const nRegistros = d.salud.length;
  el.innerHTML = `
    <div class="cabecera"><p class="eyebrow">Tu club</p><h1>Ajustes</h1></div>

    ${guardadoDisponible() ? '' : '<div class="aviso" style="margin-bottom:16px;background:var(--rojo-fondo);border-color:#F5C6C2"><span>⚠️</span><span><b>Este navegador no está guardando los datos</b> (puede ser una ventana privada). Abre el Club en una ventana normal.</span></div>'}

    <section class="tarjeta">
      <h2>💾 Respaldo</h2>
      <p class="muted">Tus datos viven solo en este teléfono. Si cambias de celular o borras el navegador, se pierden. Guarda un respaldo de vez en cuando (por ejemplo, envíatelo por correo o guárdalo en Drive o iCloud).</p>
      <p class="muted">Tienes <b>${d.gatos.length}</b> ${d.gatos.length === 1 ? 'gato' : 'gatos'} y <b>${nRegistros}</b> ${nRegistros === 1 ? 'registro' : 'registros'} de salud.</p>
      <div class="pila">
        <button class="btn btn--primario btn--bloque" type="button" id="respaldar">Guardar respaldo</button>
        <label class="btn btn--secundario btn--bloque subir">Restaurar respaldo
          <input type="file" accept=".json,application/json" id="restaurar" aria-label="Elegir archivo de respaldo">
        </label>
      </div>
    </section>

    ${tarjetaInstalar()}

    <section class="tarjeta">
      <h2>🔒 Privacidad</h2>
      <p class="muted">El Club OliJuli no tiene cuentas ni servidores: nada de lo que escribes sale de tu teléfono, salvo cuando tú compartes un afiche o un respaldo.</p>
      <p class="muted">El Club no da consejos médicos. Solo guarda las fechas y datos que te indique tu veterinario.</p>
    </section>

    <section class="tarjeta">
      <h2>¿Algo más para tu michi?</h2>
      <p class="muted">En la tienda OliJuli hay más soluciones para tu mascota, con envío gratis a todo Chile.</p>
      <a class="btn btn--secundario btn--bloque" href="https://olijuli13.myshopify.com/collections/soluciones-olijuli" target="_blank" rel="noopener">Ir a la tienda OliJuli</a>
    </section>

    <button class="btn btn--peligro btn--bloque" type="button" id="borrarTodo">Borrar todos mis datos</button>
    <p class="muted" style="text-align:center;margin-top:16px">Club OliJuli · Hecho con 🧡 por Oliver, Julieta y Cacao</p>
  `;

  el.querySelector('#respaldar').addEventListener('click', async () => {
    const blob = new Blob([respaldoJSON()], { type: 'application/json' });
    const r = await compartirODescargar(blob, `respaldo-club-olijuli-${hoyISO()}.json`, 'Respaldo Club OliJuli', 'Respaldo de mis datos del Club OliJuli');
    if (r === 'descargado') toast('Respaldo descargado. Guárdalo en un lugar seguro 💾', 3500);
    if (r === 'compartido') toast('¡Respaldo listo! 💾');
  });

  el.querySelector('#restaurar').addEventListener('change', async e => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    if (!confirm('Esto reemplazará los datos actuales de este teléfono por los del respaldo. ¿Continuar?')) return;
    try {
      const texto = await archivo.text();
      const nuevo = restaurarDesde(texto);
      toast(`Respaldo restaurado: ${nuevo.gatos.length} ${nuevo.gatos.length === 1 ? 'gato' : 'gatos'} ✓`, 3500);
      location.hash = '#/';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (err) {
      toast(err.message || 'No se pudo restaurar el respaldo.', 4000);
    }
  });

  el.querySelector('#borrarTodo').addEventListener('click', () => {
    if (!confirm('¿Borrar TODOS los datos del Club en este teléfono? Si no tienes un respaldo, no se pueden recuperar.')) return;
    borrarTodo();
    toast('Datos borrados');
    location.hash = '#/';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  conectarInstalar(el);
}

