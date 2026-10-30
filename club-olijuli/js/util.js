// Utilidades comunes: texto seguro, fechas, avisos, ventanas, fotos y archivos.

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- Fechas (se guardan como "aaaa-mm-dd") ---------- */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function hoyISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function partes(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? { a: +m[1], m: +m[2], d: +m[3] } : null;
}

export function fechaLarga(iso) {
  const p = partes(iso);
  return p ? `${p.d} de ${MESES[p.m - 1]} de ${p.a}` : '';
}

export function fechaCorta(iso) {
  const p = partes(iso);
  return p ? `${String(p.d).padStart(2, '0')}-${String(p.m).padStart(2, '0')}-${p.a}` : '—';
}

export function nombreMes(numero) {
  return MESES[numero - 1] || '';
}

export function diasHasta(iso) {
  const p = partes(iso);
  if (!p) return null;
  const objetivo = Date.UTC(p.a, p.m - 1, p.d);
  const h = new Date();
  const hoy = Date.UTC(h.getFullYear(), h.getMonth(), h.getDate());
  return Math.round((objetivo - hoy) / 86400000);
}

export function cuandoTexto(iso) {
  const n = diasHasta(iso);
  if (n === null) return '';
  if (n < -1) return `Venció hace ${-n} días`;
  if (n === -1) return 'Venció ayer';
  if (n === 0) return 'Es hoy';
  if (n === 1) return 'Es mañana';
  if (n < 30) return `En ${n} días`;
  const meses = Math.round(n / 30);
  return meses === 1 ? 'En 1 mes aprox.' : `En ${meses} meses aprox.`;
}

export function edadTexto(iso) {
  const p = partes(iso);
  if (!p) return '';
  const h = new Date();
  let meses = (h.getFullYear() - p.a) * 12 + (h.getMonth() + 1 - p.m);
  if (h.getDate() < p.d) meses--;
  if (meses < 0) return '';
  if (meses < 1) return 'Menos de 1 mes';
  if (meses < 12) return meses === 1 ? '1 mes' : `${meses} meses`;
  const anos = Math.floor(meses / 12), resto = meses % 12;
  const a = anos === 1 ? '1 año' : `${anos} años`;
  if (!resto) return a;
  return `${a} y ${resto === 1 ? '1 mes' : resto + ' meses'}`;
}

/* ---------- Avisos y ventanas ---------- */
let toastTimer = null;
export function toast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), ms);
}

export function abrirModal(titulo, html, alAbrir) {
  cerrarModal();
  const m = document.createElement('div');
  m.className = 'modal';
  m.id = 'modal';
  m.innerHTML = `<div class="modal__caja" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <div class="modal__cabeza"><h2>${esc(titulo)}</h2><button class="modal__cerrar" type="button" aria-label="Cerrar">×</button></div>
      <div class="modal__cuerpo">${html}</div></div>`;
  m.addEventListener('click', e => { if (e.target === m) cerrarModal(); });
  m.querySelector('.modal__cerrar').addEventListener('click', cerrarModal);
  document.body.appendChild(m);
  document.body.style.overflow = 'hidden';
  if (alAbrir) alAbrir(m.querySelector('.modal__cuerpo'));
  return m;
}

export function cerrarModal() {
  const m = document.getElementById('modal');
  if (m) m.remove();
  document.body.style.overflow = '';
}

/* ---------- Fotos: se achican antes de guardarlas para no llenar el teléfono ---------- */
export function achicarFoto(archivo, maxLado = 640, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    if (!archivo || !/^image\//.test(archivo.type || 'image/')) { reject(new Error('no-imagen')); return; }
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * escala));
      c.height = Math.max(1, Math.round(img.naturalHeight * escala));
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('no-imagen')); };
    img.src = url;
  });
}

export function cargarImagen(src) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* ---------- Archivos: descargar o compartir ---------- */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function puedeCompartirArchivos(blob, nombre) {
  try {
    const f = new File([blob], nombre, { type: blob.type });
    return !!(navigator.canShare && navigator.canShare({ files: [f] }));
  } catch (e) {
    return false;
  }
}

// Comparte con el menú del celular si se puede; si no, descarga. Devuelve 'compartido', 'descargado' o 'cancelado'.
export async function compartirODescargar(blob, nombre, titulo, texto) {
  if (puedeCompartirArchivos(blob, nombre)) {
    try {
      await navigator.share({ files: [new File([blob], nombre, { type: blob.type })], title: titulo, text: texto });
      return 'compartido';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelado';
    }
  }
  descargar(blob, nombre);
  return 'descargado';
}

export function esperarFuentes() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const cargas = Promise.all([
    document.fonts.load('800 80px Poppins'),
    document.fonts.load('700 40px Poppins'),
    document.fonts.load('700 40px "Nunito Sans"'),
    document.fonts.load('400 40px "Nunito Sans"')
  ]).catch(() => {});
  return Promise.race([cargas, new Promise(r => setTimeout(r, 1500))]);
}
