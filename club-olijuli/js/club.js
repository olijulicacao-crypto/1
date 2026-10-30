// Club: acceso a lo entretenido (michi, stickers, juego, fondos, música) y la sección de música.
import { esc } from './util.js';
import { gatoActivo, recordDe } from './datos.js';
import { michiDe, michiSVG } from './michi.js';

export function renderClub(el) {
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow">Club OliJuli</p>
      <h1>Lo entretenido</h1>
      <p class="muted">Todo con el michi de ${esc(gato.nombre)}.</p>
    </div>
    <a class="club-destacado" href="#/michi">
      <span>${michiSVG(michiDe(gato), { tam: 120 })}</span>
      <span><b>Crea tu Michi</b><small>Dibuja a ${esc(gato.nombre)}: pelaje, ojos, accesorios y mochila.</small></span>
    </a>
    <div class="grid-accesos">
      <a class="acceso" href="#/juego"><span class="acceso__icono">🎮</span><b>Minijuego</b><small>Récord: ${recordDe(gato.id)} puntos</small></a>
      <a class="acceso" href="#/stickers"><span class="acceso__icono">💬</span><b>Stickers</b><small>8 stickers para WhatsApp</small></a>
      <a class="acceso" href="#/fondos"><span class="acceso__icono">📱</span><b>Fondos de pantalla</b><small>3 fondos para tu celular</small></a>
      <a class="acceso" href="#/musica"><span class="acceso__icono">🎵</span><b>Música relajante</b><small>Para los viajes en la mochila</small></a>
    </div>
  `;
}

const LISTAS = [
  { titulo: 'Música para gatos', detalle: 'Listas de música pensada para gatos', spotify: 'música para gatos', youtube: 'música relajante para gatos' },
  { titulo: 'Music for Cats', detalle: 'El álbum de David Teie, compuesto para gatos', spotify: 'music for cats david teie', youtube: 'music for cats david teie' },
  { titulo: 'Sonidos suaves y piano', detalle: 'Piano tranquilo y sonidos de naturaleza', spotify: 'piano relajante', youtube: 'piano relajante para mascotas' },
  { titulo: 'Ronroneo de gato', detalle: 'Horas de ronroneo, para ti y para él', spotify: 'ronroneo de gato', youtube: 'ronroneo de gato 1 hora' }
];

export function renderMusica(el) {
  el.innerHTML = `
    <div class="cabecera">
      <p class="eyebrow">Música relajante</p>
      <h1>Música para el viaje</h1>
      <p class="muted">Ponla bajito antes de salir y durante el trayecto al veterinario. A muchos michis les ayuda a estar más tranquilos.</p>
    </div>
    ${LISTAS.map(l => `<section class="tarjeta musica">
      <h3>${esc(l.titulo)}</h3>
      <p class="muted">${esc(l.detalle)}</p>
      <div class="dos-col" style="gap:10px">
        <a class="btn btn--secundario btn--chico musica__spotify" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent(l.spotify)}">▶ Spotify</a>
        <a class="btn btn--secundario btn--chico musica__youtube" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(l.youtube)}">▶ YouTube</a>
      </div>
    </section>`).join('')}
    <section class="tarjeta tarjeta--suave">
      <h3>Tips para un viaje tranquilo</h3>
      <ul class="pasos-lista">
        <li>Deja la mochila a la vista unos días antes, con su manta adentro.</li>
        <li>Pon la música unos minutos antes de salir, a volumen bajo.</li>
        <li>Llévalo pegado a ti: tu olor y tu voz lo calman.</li>
      </ul>
      <p class="muted" style="margin:0">Si tu gato se estresa mucho en los viajes, consúltalo con tu veterinario.</p>
    </section>
  `;
}
