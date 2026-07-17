// ══════════════════════════════════════════════
// APP — bootstrap e inicialización general
// ══════════════════════════════════════════════

// ── INICIALIZACIÓN DE VISTA ──
switchGTab('ingreso');
setPeriodo('mes');
initFechas();

// ── FECHA POR DEFECTO EN FORMULARIOS ──
(function initDefaultDates() {
  const hoy = new Date().toISOString().split('T')[0];
  const gFecha = document.getElementById('g-fecha');
  if (gFecha && !gFecha.value) gFecha.value = hoy;
  const otFechaReg = document.getElementById('ot-fecha-registro');
  if (otFechaReg && !otFechaReg.value) otFechaReg.value = hoy;
})();

// ── SERVICE WORKER ──
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
