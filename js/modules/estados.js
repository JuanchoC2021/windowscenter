// ══════════════════════════════════════════════
// ESTADOS DE OT + FILTROS + ALERTAS PENDIENTES
// ══════════════════════════════════════════════

const OT_ESTADOS = {
  'crear':      { label: '📝 Crear',          color: '#8b949e', bg: 'rgba(139,148,158,0.12)', border: 'rgba(139,148,158,0.3)' },
  'pendiente':  { label: '⏳ Pendiente',       color: '#d29922', bg: 'rgba(210,153,34,0.12)',  border: 'rgba(210,153,34,0.3)' },
  'en-proceso': { label: '🔨 En proceso',      color: '#58a6ff', bg: 'rgba(88,166,255,0.12)',  border: 'rgba(88,166,255,0.3)' },
  'entregada':  { label: '📦 Entregada',       color: '#bc8cff', bg: 'rgba(130,80,223,0.12)',  border: 'rgba(130,80,223,0.3)' },
  'cobrado':    { label: '✅ Cobrado',         color: '#3fb950', bg: 'rgba(63,185,80,0.12)',   border: 'rgba(63,185,80,0.3)' },
};

function getEstadoOT(estado) {
  return OT_ESTADOS[estado] || OT_ESTADOS['pendiente'];
}

// ── FILTROS DE OT ──
function getFiltrosOT() {
  return {
    estado:    document.getElementById('ot-filtro-estado')    ? document.getElementById('ot-filtro-estado').value    : 'todos',
    persona:   document.getElementById('ot-filtro-persona')   ? document.getElementById('ot-filtro-persona').value   : 'todos',
    fechaDesde: document.getElementById('ot-filtro-desde')    ? document.getElementById('ot-filtro-desde').value    : '',
    fechaHasta: document.getElementById('ot-filtro-hasta')    ? document.getElementById('ot-filtro-hasta').value    : '',
    busqueda:  document.getElementById('ot-filtro-busqueda')  ? document.getElementById('ot-filtro-busqueda').value.trim().toLowerCase() : '',
  };
}

function aplicarFiltrosOT(ordenes) {
  const f = getFiltrosOT();
  let result = ordenes.slice();

  if (f.estado !== 'todos') {
    result = result.filter(o => (o.estado || 'pendiente') === f.estado);
  }
  if (f.persona !== 'todos') {
    result = result.filter(o => (o.persona || 'windowscenter') === f.persona);
  }
  if (f.busqueda) {
    result = result.filter(o =>
      (o.cliente || '').toLowerCase().includes(f.busqueda) ||
      (o.desc || '').toLowerCase().includes(f.busqueda) ||
      (o.id || '').includes(f.busqueda)
    );
  }
  if (f.fechaDesde) {
    result = result.filter(o => {
      const reg = parseFechaOT(o.fechaRegistro || o.fechaCreacion);
      return reg && reg >= new Date(f.fechaDesde);
    });
  }
  if (f.fechaHasta) {
    result = result.filter(o => {
      const reg = parseFechaOT(o.fechaRegistro || o.fechaCreacion);
      return reg && reg <= new Date(f.fechaHasta + 'T23:59:59');
    });
  }

  return result;
}

function parseFechaOT(str) {
  if (!str) return null;
  // YYYY-MM-DD (date input)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + 'T12:00:00');
    return isNaN(d) ? null : d;
  }
  // dd/mm/yyyy
  const parts = str.split('/');
  if (parts.length === 3) {
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    return isNaN(d) ? null : d;
  }
  return null;
}

function fmtFechaCorta(str) {
  if (!str) return '—';
  const dt = parseFechaOT(str);
  if (!dt) return str;
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── ALERTAS PAGOS PENDIENTES ──
function renderAlertasPendientes(ordenes) {
  const el = document.getElementById('ot-alertas');
  if (!el) return;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pendientes = ordenes.filter(o => {
    if (o.estado === 'cobrado' || o.estado === 'entregada') return false;
    const reg = parseFechaOT(o.fechaRegistro || o.fechaCreacion);
    if (!reg) return false;
    const dias = Math.floor((hoy - reg) / (1000 * 60 * 60 * 24));
    return dias > 7;
  });

  if (pendientes.length === 0) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:14px">⚠️</span>
      <span style="font-size:12px;font-weight:700;color:#d29922">${pendientes.length} orden${pendientes.length > 1 ? 'es' : ''} pendiente${pendientes.length > 1 ? 's' : ''} hace más de 7 días</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${pendientes.map(o => {
        const reg = parseFechaOT(o.fechaRegistro || o.fechaCreacion);
        const dias = reg ? Math.floor((hoy - reg) / (1000 * 60 * 60 * 24)) : '?';
        const estado = getEstadoOT(o.estado);
        return `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(210,153,34,0.08);border:1px solid rgba(210,153,34,0.2);border-radius:8px;font-size:12px">
          <span style="color:${estado.color};font-weight:600">${estado.label}</span>
          <span style="flex:1;font-weight:600">${o.cliente}</span>
          <span style="color:var(--ink3)">${o.desc}</span>
          <span style="font-weight:700;color:var(--amber)">${dias} días</span>
        </div>`;
      }).join('')}
    </div>`;
}

// ── ENTREGAS PRÓXIMAS (3 días) ──
function renderEntregasProximas(ordenes) {
  const el = document.getElementById('ot-entregas-proximas');
  if (!el) return;

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var limite = new Date(hoy);
  limite.setDate(limite.getDate() + 3);

  var proximas = ordenes.filter(function(o) {
    if (o.estado === 'cobrado') return false;
    if (!o.fechaEntrega) return false;
    var fe = parseFechaOT(o.fechaEntrega);
    if (!fe) return false;
    return fe >= hoy && fe <= limite;
  });

  if (proximas.length === 0) {
    el.style.display = 'none';
    return;
  }

  proximas.sort(function(a, b) {
    var fa = parseFechaOT(a.fechaEntrega);
    var fb = parseFechaOT(b.fechaEntrega);
    return fa - fb;
  });

  el.style.display = 'block';
  el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
    '<span style="font-size:14px">🚚</span>' +
    '<span style="font-size:12px;font-weight:700;color:#f85149">Entregas en los próximos 3 días</span>' +
  '</div><div style="display:flex;flex-direction:column;gap:6px">' +
  proximas.map(function(o) {
    var fe = parseFechaOT(o.fechaEntrega);
    var hoyMs = new Date(); hoyMs.setHours(0,0,0,0);
    var diff = Math.round((fe - hoyMs) / (1000*60*60*24));
    var label = diff === 0 ? 'HOY' : diff === 1 ? 'MAÑANA' : 'En ' + diff + ' días';
    var bgColor = diff === 0 ? 'rgba(248,81,73,0.15)' : 'rgba(210,153,34,0.1)';
    var borderColor = diff === 0 ? 'rgba(248,81,73,0.3)' : 'rgba(210,153,34,0.25)';
    var labelColor = diff === 0 ? '#f85149' : '#d29922';
    var estado = getEstadoOT(o.estado);
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;font-size:12px">' +
      '<span style="font-size:10px;font-weight:700;color:' + labelColor + ';background:' + (diff === 0 ? 'rgba(248,81,73,0.2)' : 'rgba(210,153,34,0.15)') + ';padding:2px 8px;border-radius:4px">' + label + '</span>' +
      '<span style="color:' + estado.color + ';font-weight:600">' + estado.label + '</span>' +
      '<span style="flex:1;font-weight:600">' + o.cliente + '</span>' +
      '<span style="color:var(--ink3)">' + o.desc + '</span>' +
      '<span style="font-size:10px;color:var(--ink3)">' + fmtFechaCorta(o.fechaEntrega) + '</span>' +
    '</div>';
  }).join('') + '</div>';
}

// ── AGENDA SEMANAL ──
function renderAgendaSemanal(ordenes) {
  var el = document.getElementById('ot-agenda-semanal');
  if (!el) return;

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  var diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var columns = [];
  for (var d = 0; d < 7; d++) {
    var dia = new Date(hoy);
    dia.setDate(dia.getDate() + d);
    var diaStr = dia.toLocaleDateString('es-AR');
    var otDia = ordenes.filter(function(o) {
      if (!o.fechaEntrega) return false;
      var fe = parseFechaOT(o.fechaEntrega);
      if (!fe) return false;
      return fe.toDateString() === dia.toDateString();
    });
    columns.push({ date: dia, label: diasSemana[dia.getDay()], diaNum: dia.getDate(), mes: dia.toLocaleDateString('es-AR', { month: 'short' }), ot: otDia, esHoy: d === 0 });
  }

  var html = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
    '<span style="font-size:14px">📅</span>' +
    '<span style="font-size:12px;font-weight:700;color:var(--ink)">Agenda de la semana</span>' +
  '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">';

  columns.forEach(function(col) {
    var bg = col.esHoy ? 'rgba(88,166,255,0.12)' : 'var(--surface)';
    var border = col.esHoy ? 'rgba(88,166,255,0.4)' : 'var(--line)';
    var headerBg = col.esHoy ? 'var(--blue)' : 'var(--ink)';
    html += '<div style="background:' + bg + ';border:1px solid ' + border + ';border-radius:8px;padding:8px;min-height:80px">' +
      '<div style="text-align:center;margin-bottom:6px"><div style="font-size:9px;font-weight:600;color:' + (col.esHoy ? 'var(--blue)' : 'var(--ink3)') + ';text-transform:uppercase">' + col.label + '</div>' +
      '<div style="font-size:16px;font-weight:700;color:var(--ink)">' + col.diaNum + '</div></div>';
    if (col.ot.length > 0) {
      col.ot.forEach(function(o) {
        var est = getEstadoOT(o.estado);
        var _ea = function(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
        html += '<div style="padding:4px 6px;border-radius:4px;font-size:9px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;background:' + est.bg + ';color:' + est.color + ';border:1px solid ' + est.border + '" title="' + _ea(o.cliente) + ' - ' + _ea(o.desc) + '">' + _ea(o.cliente) + '</div>';
      });
    } else {
      html += '<div style="text-align:center;font-size:9px;color:var(--ink3);padding-top:8px">—</div>';
    }
    html += '</div>';
  });

  html += '</div>';
  el.innerHTML = html;
}

// ── RESUMEN ANUAL ──
function renderResumenAnual(movimientos) {
  const el = document.getElementById('resumen-anual');
  if (!el) return;

  const now = new Date();
  const anioActual = now.getFullYear();
  const anioAnterior = anioActual - 1;

  function totalesPorAnio(anio) {
    let ing = 0, gas = 0, count = 0;
    movimientos.forEach(m => {
      if (m.categoria === 'gasto-costo') return;
      const dt = parseFechaMovimiento(m.fecha);
      if (!dt || dt.getFullYear() !== anio) return;
      const val = m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0);
      if (m.tipo === 'ingreso') ing += val;
      else gas += val;
      count++;
    });
    return { ing, gas, neto: ing - gas, count };
  }

  const actual = totalesPorAnio(anioActual);
  const anterior = totalesPorAnio(anioAnterior);

  const pctIng = anterior.ing > 0 ? Math.round(((actual.ing - anterior.ing) / anterior.ing) * 100) : null;
  const pctGas = anterior.gas > 0 ? Math.round(((actual.gas - anterior.gas) / anterior.gas) * 100) : null;

  const fmtPct = (pct) => {
    if (pct === null) return '<span style="color:var(--ink3)">—</span>';
    const color = pct > 0 ? (pct === pctIng ? 'var(--red)' : 'var(--green)') : (pct === pctIng ? 'var(--green)' : 'var(--red)');
    return `<span style="color:${pct >= 0 ? 'var(--red)' : 'var(--green)'};font-size:10px;font-weight:600">${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}%</span>`;
  };

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--ink);text-transform:uppercase;letter-spacing:0.3px">📊 Resumen anual</div>
        <div style="font-size:10px;color:var(--ink3);margin-top:2px">${anioActual} vs ${anioAnterior}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div style="background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-bottom:4px">Ingresos ${anioActual}</div>
        <div style="font-size:16px;font-weight:700;color:var(--green)">$${actual.ing.toLocaleString('es-AR')}</div>
        <div style="margin-top:4px">${fmtPct(pctIng)}</div>
        <div style="font-size:9px;color:var(--ink3);margin-top:4px">vs $${anterior.ing.toLocaleString('es-AR')}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-bottom:4px">Gastos ${anioActual}</div>
        <div style="font-size:16px;font-weight:700;color:var(--red)">$${actual.gas.toLocaleString('es-AR')}</div>
        <div style="margin-top:4px">${fmtPct(pctGas)}</div>
        <div style="font-size:9px;color:var(--ink3);margin-top:4px">vs $${anterior.gas.toLocaleString('es-AR')}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-bottom:4px">Neto ${anioActual}</div>
        <div style="font-size:16px;font-weight:700;color:${actual.neto >= 0 ? 'var(--green)' : 'var(--red)'}">$${actual.neto.toLocaleString('es-AR')}</div>
        <div style="font-size:9px;color:var(--ink3);margin-top:4px">vs $${anterior.neto.toLocaleString('es-AR')}</div>
      </div>
    </div>`;
}
