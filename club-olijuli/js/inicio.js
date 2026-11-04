// Inicio: bienvenida la primera vez y, después, el resumen del gato con accesos rápidos.
import { esc } from './util.js';
import { gatoActivo, paseosDe, recordDe } from './datos.js';
import { SELLOS, sellosGanados } from './diario.js';
import { avatar, resumenGato } from './gato.js';
import { proximos, itemRecordatorio, conectarCalendario } from './salud.js';
import { tarjetaInstalar } from './ajustes.js';
import { michiSVG, michiDe } from './michi.js';

function bienvenida(el) {
  el.innerHTML = `
    <section class="bienvenida">
      <img class="bienvenida__logo" src="icons/logo-olijuli.jpg" alt="Logo de OliJuli">
      <p class="eyebrow">Regalo con tu compra en OliJuli</p>
      <h1>¡Bienvenido al Club OliJuli! 🧡</h1>
      <p class="muted">Gracias por tu compra. Este club es para que cuidar y disfrutar a tu michi sea más fácil.</p>
      <ul>
        <li><span>🐱</span><span><b>Perfil de tu gato</b><br><span class="muted">Sus datos y su foto, siempre a mano.</span></span></li>
        <li><span>💉</span><span><b>Carnet de salud</b><br><span class="muted">Vacunas y antiparasitarios con recordatorios en tu calendario.</span></span></li>
        <li><span>🚨</span><span><b>Afiche "SE BUSCA" en 10 segundos</b><br><span class="muted">Si se pierde, lo compartes con un toque.</span></span></li>
      </ul>
      <a class="btn btn--primario btn--bloque" href="#/gato/nuevo">Crear el perfil de mi gato</a>
      <p class="muted" style="margin-top:14px">Tus datos quedan solo en este teléfono. Nadie más los ve.</p>
    </section>
  `;
}

export function renderInicio(el) {
  const gato = gatoActivo();
  if (!gato) { bienvenida(el); return; }
  const prox = proximos(gato.id).slice(0, 3);
  const chips = resumenGato(gato);
  const paseos = paseosDe(gato.id).length;
  const sellos = sellosGanados(gato.id);
  const record = recordDe(gato.id);

  el.innerHTML = `
    <section class="tarjeta hola">
      ${avatar(gato, 'avatar--xl')}
      <div class="hola__datos">
        <p class="eyebrow">Miembro del club</p>
        <h1>${esc(gato.nombre)}</h1>
        <div class="chips">${chips.length ? chips.map(c => `<span class="chip">${esc(c)}</span>`).join('') : '<a href="#/gato">Completar perfil →</a>'}</div>
      </div>
    </section>

    <div class="grid-accesos">
      <a class="acceso acceso--alerta" href="#/perdido">
        <span class="acceso__icono">🚨</span><b>¿Se perdió?</b><small>Afiche SE BUSCA en 10 segundos</small>
      </a>
      <a class="acceso" href="#/salud">
        <span class="acceso__icono">💉</span><b>Carnet de salud</b><small>Vacunas, antiparasitarios y visitas</small>
      </a>
      <a class="acceso" href="#/aventuras">
        <span class="acceso__icono">🎒</span><b>Diario de aventuras</b><small>${paseos ? `${paseos} ${paseos === 1 ? 'paseo anotado' : 'paseos anotados'}` : 'Anota su primer paseo'}</small>
      </a>
      <a class="acceso" href="#/pasaporte">
        <span class="acceso__icono">🛂</span><b>Pasaporte</b><small>${sellos} de ${SELLOS.length} sellos</small>
      </a>
      <a class="acceso acceso--michi" href="#/michi">
        <span class="acceso__michi">${michiSVG(michiDe(gato), { tam: 64 })}</span><b>Crea tu Michi</b><small>Dibuja a ${esc(gato.nombre)} a tu pinta</small>
      </a>
      <a class="acceso" href="#/juego">
        <span class="acceso__icono">🎮</span><b>Minijuego</b><small>${record ? `Récord: ${record} puntos` : '¡Juega con tu michi!'}</small>
      </a>
    </div>

    <section class="tarjeta">
      <div class="fila fila--entre"><h2>Próximos recordatorios</h2><a href="#/salud" class="muted">Ver todo</a></div>
      ${prox.length ? prox.map(r => itemRecordatorio(r, gato)).join('') : `<div class="vacio"><span>📅</span>Anota la última vacuna o antiparasitario y te ayudamos a recordar el próximo.<br><a class="btn btn--secundario btn--chico" style="margin-top:10px" href="#/salud">Ir al carnet</a></div>`}
    </section>

    ${tarjetaInstalar()}
  `;
  conectarCalendario(el, gato);
}
