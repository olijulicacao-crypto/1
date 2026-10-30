// Minijuego "Michi explorador": 45 segundos saltando obstáculos y atrapando pescaditos.
import { esc } from './util.js';
import { gatoActivo, recordDe, guardarRecord } from './datos.js';
import { michiDe, michiImagen } from './michi.js';

const DURACION = 45;
const ALTO = 400;            // alto del mundo en unidades; el ancho depende de la pantalla
const SUELO = 330;
const GRAVEDAD = 2300;
const SALTO = -860;
const SALTO_DOBLE = -720;
const TAM_MICHI = 92;

let juegoActivo = null;

export function detenerJuego() {
  if (juegoActivo) { juegoActivo(); juegoActivo = null; }
}

function dibujarPez(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#56A3E8'; ctx.strokeStyle = '#3B2314'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(28, -10); ctx.lineTo(28, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-8, -2, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3B2314'; ctx.beginPath(); ctx.arc(-8, -2, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function dibujarObstaculo(ctx, o) {
  ctx.save();
  ctx.strokeStyle = '#3B2314'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  if (o.tipo === 'caja') {
    ctx.fillStyle = '#C8834B'; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#E0A56B'; ctx.fillRect(o.x + o.w / 2 - 6, o.y, 12, o.h);
    ctx.beginPath(); ctx.moveTo(o.x, o.y + 12); ctx.lineTo(o.x + o.w, o.y + 12); ctx.stroke();
  } else if (o.tipo === 'pepino') {
    ctx.fillStyle = '#4E9F3D';
    ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8ED16B';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(o.x + 14 + i * 12, o.y + o.h / 2 - 3, 2.4, 0, Math.PI * 2); ctx.fill(); }
  } else if (o.tipo === 'charco') {
    ctx.fillStyle = '#7FB3D5';
    ctx.beginPath(); ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath(); ctx.moveTo(o.x + 18, o.y + o.h / 2); ctx.lineTo(o.x + 34, o.y + o.h / 2 - 2); ctx.stroke();
  } else {
    // aspiradora
    ctx.fillStyle = '#6E7B8B';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(o.x, o.y + 14, o.w, o.h - 14, 12) : ctx.rect(o.x, o.y + 14, o.w, o.h - 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#D93A3A'; ctx.fillRect(o.x + 8, o.y + 24, o.w - 16, 10);
    ctx.strokeStyle = '#3B2314'; ctx.beginPath(); ctx.moveTo(o.x + o.w - 10, o.y + 14); ctx.lineTo(o.x + o.w + 6, o.y - 4); ctx.lineTo(o.x + o.w + 18, o.y - 4); ctx.stroke();
    ctx.fillStyle = '#1E1E1E';
    ctx.beginPath(); ctx.arc(o.x + 12, o.y + o.h, 6, 0, Math.PI * 2); ctx.arc(o.x + o.w - 12, o.y + o.h, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function corazon(ctx, x, y, lleno) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1.1, 1.1);
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-14, 0, -12, -10, -5, -10); ctx.bezierCurveTo(-2, -10, 0, -7, 0, -5);
  ctx.bezierCurveTo(0, -7, 2, -10, 5, -10); ctx.bezierCurveTo(12, -10, 14, 0, 0, 9); ctx.closePath();
  ctx.fillStyle = lleno ? '#E53950' : 'rgba(59,35,20,.18)'; ctx.fill();
  ctx.restore();
}

export function renderJuego(el) {
  detenerJuego();
  const gato = gatoActivo();
  if (!gato) { location.hash = '#/gato/nuevo'; return; }
  let record = recordDe(gato.id);

  el.innerHTML = `
    <div class="cabecera fila fila--entre">
      <div><p class="eyebrow">Minijuego</p><h1>Michi explorador</h1></div>
      <div class="record">🏆 <b id="recordTxt">${record}</b><small>récord</small></div>
    </div>
    <div class="juego" id="juego">
      <canvas id="lienzo" aria-label="Juego: toca para saltar"></canvas>
      <div class="juego__capa" id="capa">
        <div class="juego__panel">
          <h2>¡Ayuda a ${esc(gato.nombre)} a explorar!</h2>
          <p>Toca la pantalla para saltar (toca dos veces para un doble salto). Atrapa pescaditos 🐟 y esquiva las cajas, pepinos, charcos y aspiradoras.</p>
          <button class="btn btn--primario" type="button" id="jugar">▶️ Jugar</button>
        </div>
      </div>
    </div>
    <p class="muted" style="text-align:center;margin-top:10px">Cada partida dura ${DURACION} segundos · 🐟 = 10 puntos</p>
    <a class="btn btn--secundario btn--bloque" href="#/michi">🎨 Cambiar mi michi</a>
  `;

  const caja = el.querySelector('#juego');
  const canvas = el.querySelector('#lienzo');
  const capa = el.querySelector('#capa');
  const ctx = canvas.getContext('2d');
  let ancho = 600, escala = 1, sprite = null, spriteGolpe = null;
  let st = null, raf = 0, ultimo = 0, vivo = true;

  function medir() {
    const r = caja.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    escala = canvas.height / ALTO;
    ancho = canvas.width / escala;
  }

  const cfg = michiDe(gato);
  Promise.all([
    michiImagen(cfg, { tam: 240, margen: 4 }),
    michiImagen(cfg, { tam: 240, margen: 4, expresion: 'sorpresa' })
  ]).then(([a, b]) => { sprite = a; spriteGolpe = b; if (!st) dibujarPortada(); });

  function nuevoEstado() {
    return { t: 0, puntos: 0, vidas: 3, y: SUELO - TAM_MICHI, vy: 0, saltos: 0, inv: 0, vel: 300, obst: [], peces: [], prox: 1.2, proxPez: 0.6, fondo: 0, fin: false, golpe: 0 };
  }

  function saltar() {
    if (!st || st.fin) return;
    if (st.saltos === 0) { st.vy = SALTO; st.saltos = 1; }
    else if (st.saltos === 1) { st.vy = SALTO_DOBLE; st.saltos = 2; }
  }

  function crearObstaculo() {
    const tipos = st.t < 8 ? ['caja', 'charco', 'pepino'] : ['caja', 'charco', 'pepino', 'aspiradora'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const dims = { caja: [46, 46], pepino: [64, 24], charco: [78, 14], aspiradora: [52, 58] }[tipo];
    st.obst.push({ tipo, x: ancho + 20, y: SUELO - dims[1] + (tipo === 'charco' ? 4 : 0), w: dims[0], h: dims[1], pasado: false });
  }

  function crearPeces() {
    const fila = Math.random() < 0.35 ? 3 : 1;
    const altura = SUELO - 60 - Math.random() * 150;
    for (let i = 0; i < fila; i++) st.peces.push({ x: ancho + 20 + i * 46, y: altura - (fila === 3 ? Math.sin(i * 1.5) * 26 : 0), ok: false });
  }

  function fondo(off) {
    const cielo = ctx.createLinearGradient(0, 0, 0, SUELO);
    cielo.addColorStop(0, '#FFE6D1'); cielo.addColorStop(1, '#FFF7EF');
    ctx.fillStyle = cielo; ctx.fillRect(0, 0, ancho, ALTO);
    ctx.fillStyle = '#FFC04D'; ctx.beginPath(); ctx.arc(ancho - 70, 70, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 260 - off * 0.15) % (ancho + 200) + ancho + 200) % (ancho + 200) - 100;
      ctx.beginPath(); ctx.ellipse(x, 60 + (i % 2) * 40, 46, 16, 0, 0, Math.PI * 2); ctx.ellipse(x + 30, 52 + (i % 2) * 40, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#FFD2AE';
    ctx.beginPath(); ctx.moveTo(0, SUELO);
    for (let x = 0; x <= ancho; x += 20) ctx.lineTo(x, SUELO - 70 - Math.sin((x + off * 0.3) / 90) * 26);
    ctx.lineTo(ancho, SUELO); ctx.fill();
    ctx.fillStyle = '#FF9A4D';
    ctx.beginPath(); ctx.moveTo(0, SUELO);
    for (let x = 0; x <= ancho; x += 20) ctx.lineTo(x, SUELO - 34 - Math.sin((x + off * 0.6) / 60) * 14);
    ctx.lineTo(ancho, SUELO); ctx.fill();
    ctx.fillStyle = '#8ED16B'; ctx.fillRect(0, SUELO, ancho, 12);
    ctx.fillStyle = '#E8C9A8'; ctx.fillRect(0, SUELO + 12, ancho, ALTO - SUELO - 12);
    ctx.fillStyle = 'rgba(59,35,20,.12)';
    for (let x = -((off) % 60); x < ancho; x += 60) ctx.fillRect(x, SUELO + 34, 30, 6);
  }

  function dibujarMichi(x, y, rot, golpe) {
    const img = golpe && spriteGolpe ? spriteGolpe : sprite;
    ctx.save();
    ctx.translate(x + TAM_MICHI / 2, y + TAM_MICHI / 2); ctx.rotate(rot);
    if (img) ctx.drawImage(img, -TAM_MICHI / 2, -TAM_MICHI / 2, TAM_MICHI, TAM_MICHI);
    else { ctx.fillStyle = '#F2994A'; ctx.beginPath(); ctx.arc(0, 0, TAM_MICHI / 2.4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function dibujarPortada() {
    medir();
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    fondo(0);
    dibujarMichi(80, SUELO - TAM_MICHI, 0, false);
    dibujarPez(ctx, 260, SUELO - 120);
    dibujarObstaculo(ctx, { tipo: 'caja', x: 360, y: SUELO - 46, w: 46, h: 46 });
  }

  function hud() {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(12, 12, ancho - 24, 46, 23) : ctx.rect(12, 12, ancho - 24, 46); ctx.fill();
    ctx.fillStyle = '#3B2314'; ctx.font = '800 22px Poppins, Arial, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`🐟 ${st.puntos}`, 28, 36);
    for (let i = 0; i < 3; i++) corazon(ctx, ancho - 104 + i * 30, 36, i < st.vidas);
    const resto = Math.max(0, DURACION - st.t);
    const bw = Math.max(60, ancho - 360), bx = (ancho - bw) / 2;
    ctx.fillStyle = 'rgba(59,35,20,.12)'; ctx.fillRect(bx, 30, bw, 12);
    ctx.fillStyle = resto < 10 ? '#D93A3A' : '#E85500'; ctx.fillRect(bx, 30, bw * resto / DURACION, 12);
    ctx.textAlign = 'center'; ctx.font = '700 13px "Nunito Sans", Arial, sans-serif'; ctx.fillStyle = '#3B2314';
    ctx.fillText(`${Math.ceil(resto)} s`, ancho / 2, 52);
  }

  function choca(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function paso(ahora) {
    if (!vivo) return;
    const dt = Math.min(0.035, (ahora - ultimo) / 1000 || 0);
    ultimo = ahora;
    if (!st.fin) actualizar(dt);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    fondo(st.fondo);
    st.peces.forEach(p => { if (!p.ok) dibujarPez(ctx, p.x, p.y + Math.sin((st.t * 5) + p.x / 40) * 4); });
    st.obst.forEach(o => dibujarObstaculo(ctx, o));
    const parpadea = st.inv > 0 && Math.floor(st.inv * 12) % 2 === 0;
    if (!parpadea) dibujarMichi(80, st.y, st.saltos ? Math.max(-0.35, Math.min(0.35, st.vy / 2400)) : Math.sin(st.t * 18) * 0.04, st.golpe > 0);
    hud();
    if (!st.fin) raf = requestAnimationFrame(paso);
  }

  function actualizar(dt) {
    st.t += dt;
    st.vel = 300 + Math.min(1, st.t / DURACION) * 280;
    st.fondo += st.vel * dt;
    st.vy += GRAVEDAD * dt;
    st.y += st.vy * dt;
    if (st.y >= SUELO - TAM_MICHI) { st.y = SUELO - TAM_MICHI; st.vy = 0; st.saltos = 0; }
    st.inv = Math.max(0, st.inv - dt);
    st.golpe = Math.max(0, st.golpe - dt);

    st.prox -= dt;
    if (st.prox <= 0) { crearObstaculo(); st.prox = (0.95 + Math.random() * 0.9) * (300 / st.vel) * 1.25; }
    st.proxPez -= dt;
    if (st.proxPez <= 0) { crearPeces(); st.proxPez = 0.9 + Math.random() * 1.1; }

    const yo = { x: 80 + 20, y: st.y + 22, w: TAM_MICHI - 40, h: TAM_MICHI - 30 };
    st.obst.forEach(o => {
      o.x -= st.vel * dt;
      const caja = { x: o.x + 6, y: o.y + (o.tipo === 'charco' ? 2 : 6), w: o.w - 12, h: o.h - 6 };
      if (st.inv <= 0 && choca(yo, caja)) {
        st.vidas--; st.inv = 1.3; st.golpe = 0.6;
        if (navigator.vibrate) navigator.vibrate(60);
        if (st.vidas <= 0) terminar();
      }
      if (!o.pasado && o.x + o.w < 80) { o.pasado = true; st.puntos += 2; }
    });
    st.peces.forEach(p => {
      p.x -= st.vel * dt;
      if (!p.ok && choca(yo, { x: p.x - 16, y: p.y - 12, w: 40, h: 24 })) { p.ok = true; st.puntos += 10; }
    });
    st.obst = st.obst.filter(o => o.x > -120);
    st.peces = st.peces.filter(p => p.x > -60 && !p.ok);
    if (st.t >= DURACION) terminar();
  }

  function terminar() {
    if (st.fin) return;
    st.fin = true;
    const nuevoRecord = st.puntos > record;
    if (nuevoRecord) { record = st.puntos; guardarRecord(gato.id, record); el.querySelector('#recordTxt').textContent = record; }
    const tiempo = Math.min(DURACION, Math.round(st.t));
    capa.hidden = false;
    capa.innerHTML = `<div class="juego__panel">
      <h2>${st.vidas <= 0 ? '¡Uy! Se acabaron las vidas' : '¡Exploración completa!'}</h2>
      <p class="juego__puntos">${st.puntos} <small>puntos</small></p>
      <p>${nuevoRecord ? '🎉 <b>¡Nuevo récord!</b>' : `Tu récord: <b>${record}</b>`} · ${tiempo} s explorando</p>
      <button class="btn btn--primario" type="button" id="jugar">🔁 Jugar de nuevo</button>
    </div>`;
    capa.querySelector('#jugar').addEventListener('click', empezar);
  }

  function empezar(e) {
    if (e) e.stopPropagation();
    medir();
    st = nuevoEstado();
    capa.hidden = true;
    ultimo = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(paso);
  }

  const alTocar = e => {
    if (!capa.hidden) return;
    e.preventDefault();
    saltar();
  };
  const alTeclado = e => { if ((e.code === 'Space' || e.code === 'ArrowUp') && st && !st.fin && capa.hidden) { e.preventDefault(); saltar(); } };
  const alOcultar = () => { if (document.hidden && st && !st.fin) { cancelAnimationFrame(raf); } else if (!document.hidden && st && !st.fin) { ultimo = performance.now(); raf = requestAnimationFrame(paso); } };
  const alCambiarTam = () => { if (!st || st.fin) dibujarPortada(); else medir(); };

  caja.addEventListener('pointerdown', alTocar);
  document.addEventListener('keydown', alTeclado);
  document.addEventListener('visibilitychange', alOcultar);
  window.addEventListener('resize', alCambiarTam);
  el.querySelector('#jugar').addEventListener('click', empezar);

  juegoActivo = () => {
    vivo = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', alTeclado);
    document.removeEventListener('visibilitychange', alOcultar);
    window.removeEventListener('resize', alCambiarTam);
  };

  dibujarPortada();
  if (!sprite) setTimeout(() => { if (!st) dibujarPortada(); }, 400);
}
