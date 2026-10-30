// Datos del club: viven solo en este teléfono (localStorage) y se pueden respaldar en un archivo.
import { nuevoId } from './util.js';

const CLAVE = 'clubOliJuli.v1';
const VERSION = 1;

function vacio() {
  return { v: VERSION, dueno: { nombre: '', telefono: '' }, gatos: [], activo: null, salud: [], perdido: {}, extra: {} };
}

function normalizar(d) {
  const base = vacio();
  if (!d || typeof d !== 'object') return base;
  return {
    v: VERSION,
    dueno: Object.assign(base.dueno, d.dueno && typeof d.dueno === 'object' ? d.dueno : {}),
    gatos: Array.isArray(d.gatos) ? d.gatos.filter(g => g && g.id) : [],
    activo: d.activo || null,
    salud: Array.isArray(d.salud) ? d.salud.filter(r => r && r.id) : [],
    perdido: d.perdido && typeof d.perdido === 'object' ? d.perdido : {},
    // Las etapas siguientes guardan aquí sus propios datos (michi, diario, récords...).
    extra: d.extra && typeof d.extra === 'object' ? d.extra : {}
  };
}

let estado = cargar();
let almacenamientoOk = true;

function cargar() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return normalizar(crudo ? JSON.parse(crudo) : null);
  } catch (e) {
    almacenamientoOk = false;
    return normalizar(null);
  }
}

// Devuelve true si se guardó. Si el teléfono no tiene espacio, avisa a quien llamó.
export function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    almacenamientoOk = true;
    return true;
  } catch (e) {
    almacenamientoOk = false;
    return false;
  }
}

export function datos() { return estado; }
export function guardadoDisponible() { return almacenamientoOk; }

/* ---------- Gatos ---------- */
export function gatoActivo() {
  return estado.gatos.find(g => g.id === estado.activo) || estado.gatos[0] || null;
}

export function elegirGato(id) {
  estado.activo = id;
  return guardar();
}

export function guardarGato(gato) {
  if (!gato.id) {
    gato.id = nuevoId();
    estado.gatos.push(gato);
  } else {
    const i = estado.gatos.findIndex(g => g.id === gato.id);
    if (i >= 0) estado.gatos[i] = gato; else estado.gatos.push(gato);
  }
  estado.activo = gato.id;
  return guardar();
}

export function borrarGato(id) {
  estado.gatos = estado.gatos.filter(g => g.id !== id);
  estado.salud = estado.salud.filter(r => r.gatoId !== id);
  if (Array.isArray(estado.extra.diario)) estado.extra.diario = estado.extra.diario.filter(p => p.gatoId !== id);
  if (estado.extra.juego) delete estado.extra.juego[id];
  if (estado.activo === id) estado.activo = estado.gatos[0] ? estado.gatos[0].id : null;
  return guardar();
}

/* ---------- Salud ---------- */
export function registrosDe(gatoId) {
  return estado.salud.filter(r => r.gatoId === gatoId);
}

export function guardarRegistro(reg) {
  if (!reg.id) {
    reg.id = nuevoId();
    estado.salud.push(reg);
  } else {
    const i = estado.salud.findIndex(r => r.id === reg.id);
    if (i >= 0) estado.salud[i] = reg; else estado.salud.push(reg);
  }
  return guardar();
}

export function borrarRegistro(id) {
  estado.salud = estado.salud.filter(r => r.id !== id);
  return guardar();
}

/* ---------- Diario de aventuras ---------- */
export function paseosDe(gatoId) {
  const lista = Array.isArray(estado.extra.diario) ? estado.extra.diario : [];
  return lista.filter(p => p.gatoId === gatoId);
}

export function guardarPaseo(paseo) {
  if (!Array.isArray(estado.extra.diario)) estado.extra.diario = [];
  const lista = estado.extra.diario;
  if (!paseo.id) {
    paseo.id = nuevoId();
    lista.push(paseo);
  } else {
    const i = lista.findIndex(p => p.id === paseo.id);
    if (i >= 0) lista[i] = paseo; else lista.push(paseo);
  }
  return guardar();
}

export function borrarPaseo(id) {
  if (Array.isArray(estado.extra.diario)) estado.extra.diario = estado.extra.diario.filter(p => p.id !== id);
  return guardar();
}

/* ---------- Minijuego ---------- */
export function recordDe(gatoId) {
  return (estado.extra.juego && estado.extra.juego[gatoId]) || 0;
}

export function guardarRecord(gatoId, puntos) {
  if (!estado.extra.juego) estado.extra.juego = {};
  estado.extra.juego[gatoId] = puntos;
  return guardar();
}

// Porcentaje aproximado del espacio del navegador en uso (los navegadores permiten unos 5 millones de caracteres).
export function espacioUsado() {
  try { return Math.min(100, Math.round((localStorage.getItem(CLAVE) || '').length / 50000)); } catch (e) { return 0; }
}

/* ---------- Respaldo ---------- */
export function respaldoJSON() {
  return JSON.stringify({ app: 'Club OliJuli', creado: new Date().toISOString(), datos: estado }, null, 1);
}

// Valida el archivo antes de reemplazar nada. Lanza un error con un mensaje para mostrar.
export function restaurarDesde(texto) {
  let obj;
  try { obj = JSON.parse(texto); } catch (e) { throw new Error('El archivo no es un respaldo válido.'); }
  const d = obj && obj.app === 'Club OliJuli' ? obj.datos : null;
  if (!d || !Array.isArray(d.gatos)) throw new Error('Este archivo no es un respaldo del Club OliJuli.');
  const anterior = estado;
  estado = normalizar(d);
  if (!guardar()) {
    estado = anterior;
    throw new Error('No hay espacio suficiente en el teléfono para restaurar.');
  }
  return estado;
}

export function borrarTodo() {
  estado = vacio();
  try { localStorage.removeItem(CLAVE); } catch (e) { /* sin acceso al almacenamiento */ }
}
