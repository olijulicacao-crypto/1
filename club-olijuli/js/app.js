// Club OliJuli: rutas simples con "#/" y arranque de la app.
import { esc } from './util.js';
import { datos, gatoActivo } from './datos.js';
import { renderInicio } from './inicio.js';
import { renderGato, elegirGatoModal, avatar } from './gato.js';
import { renderSalud, renderCarnet } from './salud.js';
import { renderPerdido } from './perdido.js';
import { renderAjustes, conectarInstalar } from './ajustes.js';
import { renderMichi } from './michi.js';
import { renderStickers } from './stickers.js';

const RUTAS = {
  '': { vista: renderInicio, tab: 'inicio' },
  'gato': { vista: renderGato, tab: 'gato' },
  'gato/nuevo': { vista: renderGato, tab: 'gato' },
  'salud': { vista: renderSalud, tab: 'salud' },
  'carnet': { vista: renderCarnet, tab: 'salud' },
  'perdido': { vista: renderPerdido, tab: 'perdido' },
  'ajustes': { vista: renderAjustes, tab: 'ajustes' },
  'michi': { vista: renderMichi, tab: 'gato' },
  'stickers': { vista: renderStickers, tab: 'gato' }
};

const main = document.getElementById('vista');
const botonGato = document.getElementById('cambiarGato');

function actualizarBarra() {
  const d = datos();
  const g = gatoActivo();
  if (!g) { botonGato.hidden = true; return; }
  botonGato.hidden = false;
  botonGato.innerHTML = `${avatar(g, 'mini')}<span>${esc(g.nombre)}</span>${d.gatos.length > 1 ? ' ▾' : ''}`;
}

function mostrar() {
  const ruta = location.hash.replace(/^#\/?/, '').split('?')[0];
  const r = RUTAS[ruta] || RUTAS[''];
  r.vista(main, ruta);
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('activo', a.dataset.tab === r.tab));
  actualizarBarra();
  conectarInstalar(main);
  window.scrollTo(0, 0);
}

botonGato.addEventListener('click', () => elegirGatoModal(mostrar));
window.addEventListener('hashchange', mostrar);
mostrar();

// Funciona sin internet una vez abierta (solo en https o en el computador de pruebas).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
