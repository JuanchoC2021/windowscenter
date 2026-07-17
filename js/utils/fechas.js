// ══════════════════════════════════════════════
// FECHAS — parseo y filtro por período (usado en Gestión / Finanzas)
// ══════════════════════════════════════════════

let gPeriodoActivo = 'mes';

function setPeriodo(p) {
  gPeriodoActivo = p;
  // Actualizar estilos de botones preset
  ['hoy','semana','mes','todo','custom'].forEach(id => {
    const btn = document.getElementById('gp-' + id);
    if (!btn) return;
    const activo = id === p;
    btn.style.background    = activo ? 'var(--ink)' : '';
    btn.style.color         = activo ? 'white' : '';
    btn.style.borderColor   = activo ? 'var(--ink)' : '';
  });
  // Mostrar/ocultar rango personalizado
  const rangoEl = document.getElementById('g-rango-custom');
  if (rangoEl) rangoEl.style.display = p === 'custom' ? 'flex' : 'none';
  // Si es custom, inicializar fechas con el mes actual si están vacías
  if (p === 'custom') {
    const desde = document.getElementById('g-fecha-desde');
    const hasta = document.getElementById('g-fecha-hasta');
    if (desde && !desde.value) {
      const hoy = new Date();
      desde.value = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0,10);
      hasta.value = hoy.toISOString().slice(0,10);
    }
  }
  if (typeof renderGestion === 'function') renderGestion();
}

function parseFechaMovimiento(fechaStr) {
  // formato: "dd/mm/yyyy hh:mm" o "dd/mm/yyyy"
  if (!fechaStr) return null;
  const partes = fechaStr.split(' ')[0].split('/');
  if (partes.length < 3) return null;
  return new Date(parseInt(partes[2]), parseInt(partes[1])-1, parseInt(partes[0]));
}

function getFechasFiltro() {
  const hoy = new Date();
  hoy.setHours(23,59,59,999);
  if (gPeriodoActivo === 'hoy') {
    const inicio = new Date(); inicio.setHours(0,0,0,0);
    return { desde: inicio, hasta: hoy };
  }
  if (gPeriodoActivo === 'semana') {
    const inicio = new Date();
    inicio.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
    inicio.setHours(0,0,0,0);
    return { desde: inicio, hasta: hoy };
  }
  if (gPeriodoActivo === 'mes') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: inicio, hasta: hoy };
  }
  if (gPeriodoActivo === 'custom') {
    const desdeVal = document.getElementById('g-fecha-desde') ? document.getElementById('g-fecha-desde').value : '';
    const hastaVal = document.getElementById('g-fecha-hasta') ? document.getElementById('g-fecha-hasta').value : '';
    const desde = desdeVal ? new Date(desdeVal + 'T00:00:00') : null;
    const hasta = hastaVal ? new Date(hastaVal + 'T23:59:59') : null;
    return { desde, hasta };
  }
  return { desde: null, hasta: null }; // 'todo'
}

function filtrarPorPeriodo(movs) {
  const { desde, hasta } = getFechasFiltro();
  if (!desde && !hasta) return movs;
  return movs.filter(m => {
    const f = parseFechaMovimiento(m.fecha);
    if (!f) return true;
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  });
}

// Inicializa los inputs de fecha del día actual (gestión / órdenes)
function initFechas() {
  const hoy = new Date().toISOString().split('T')[0];
  const gFecha = document.getElementById('g-fecha');
  const otFecha = document.getElementById('ot-fecha-registro');
  if (gFecha) gFecha.value = hoy;
  if (otFecha) otFecha.value = hoy;
}