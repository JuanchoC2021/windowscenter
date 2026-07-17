// ══════════════════════════════════════════════
// BUSCADOR GLOBAL (con debounce)
// ══════════════════════════════════════════════

let _buscarTimer = null;

function buscarGlobalDebounced(query) {
  clearTimeout(_buscarTimer);
  _buscarTimer = setTimeout(() => buscarGlobal(query), 400);
}

function buscarGlobal(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return;

  const movimientos = window.movimientos || [];
  const ordenes = window.ordenesTrabajoData || [];

  const movFiltrados = movimientos.filter(m =>
    (m.desc || '').toLowerCase().includes(q) ||
    (m.categoria || '').toLowerCase().includes(q) ||
    (m.persona || '').toLowerCase().includes(q) ||
    String(m.monto || '').includes(q)
  );

  const otFiltradas = ordenes.filter(o =>
    (o.cliente || '').toLowerCase().includes(q) ||
    (o.desc || '').toLowerCase().includes(q) ||
    (o.id || '').includes(q)
  );

  if (movFiltrados.length === 0 && otFiltradas.length === 0) {
    showToast('🔍 Sin resultados para "' + query + '"');
    return;
  }

  showToast(`🔍 ${movFiltrados.length} mov + ${otFiltradas.length} OT`);

  if (otFiltradas.length > 0) {
    switchGMain('ordenes');
    setTimeout(() => {
      const busq = document.getElementById('ot-filtro-busqueda');
      if (busq) { busq.value = query; aplicarFiltroOT(); }
    }, 100);
  } else if (movFiltrados.length > 0) {
    switchGMain('finanzas');
  }
}
