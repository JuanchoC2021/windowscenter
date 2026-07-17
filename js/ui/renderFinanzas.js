// ══════════════════════════════════════════════
// RENDER — Panel de Finanzas / Gestión del Taller
// ══════════════════════════════════════════════
var _escHtml = function(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };

window.renderGestion = function() {
  const movimientos = window.movimientos || [];

  // Saldo a favor vs saldo que debe (consumo de favor vs retiros)
  // Querés que en Adrian/Enzo figure:
  // - “Saldo a favor” si los gasto-costo superan los retiros
  // - “Saldo que deben” si los retiros superan los gasto-costo

  // saldo a favor = acumulado de gasto-costo - acumulado de retiros
  // (ambos se registran como tipo="gasto")
  // FIX: usar m.monto cuando filtramos por persona específica, no m.montoOriginal
  const adrianFavorCostos = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'gasto-costo').reduce((s,m) => s + (m.monto || 0), 0);
  const adrianRetiroCaja  = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'retiro-caja').reduce((s,m) => s + (m.monto || 0), 0);
  const adrianSaldoNeto   = adrianFavorCostos - adrianRetiroCaja; // + = a favor, - = debe
  const adrianFavorCount  = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'gasto-costo').length;
  const adrianRetiroCount = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'retiro-caja').length;

  const elAdrianTotalSaldo = document.getElementById('adrian-total-saldo');
  const elAdrianTotalCount = document.getElementById('adrian-total-count');

  // Mostrar “saldo a favor/debe” (gasto-costo - retiros), unificado en una sola tarjeta
  const fmtSaldo = (v) => {
    const abs = Math.abs(v).toLocaleString('es-AR');
    return (v >= 0 ? '$' : '-$') + abs;
  };

  if (elAdrianTotalSaldo) {
    elAdrianTotalSaldo.textContent = fmtSaldo(adrianSaldoNeto);
    elAdrianTotalSaldo.style.color = adrianSaldoNeto >= 0 ? '#3fb950' : '#f85149';
  }
  if (elAdrianTotalCount) elAdrianTotalCount.textContent = (adrianRetiroCount + adrianFavorCount);


  const enzoFavorCostos = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'gasto-costo').reduce((s,m) => s + (m.monto || 0), 0);
  const enzoRetiroCaja  = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'retiro-caja').reduce((s,m) => s + (m.monto || 0), 0);
  const enzoSaldoNeto   = enzoFavorCostos - enzoRetiroCaja; // + = a favor, - = debe
  const enzoFavorCount  = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'gasto-costo').length;
  const enzoRetiroCount = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'retiro-caja').length;

  const elEnzoTotalSaldo = document.getElementById('enzo-total-saldo');
  const elEnzoTotalCount = document.getElementById('enzo-total-count');

  if (elEnzoTotalSaldo) {
    elEnzoTotalSaldo.textContent = fmtSaldo(enzoSaldoNeto);
    elEnzoTotalSaldo.style.color = enzoSaldoNeto >= 0 ? '#58a6ff' : '#f85149';
  }
  if (elEnzoTotalCount) elEnzoTotalCount.textContent = (enzoRetiroCount + enzoFavorCount);


  const montoGlobal = m => m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0);
  const totalesWC = getTotalesWindowsCenter();
  const totalIng = totalesWC.totalIng;
  const totalGas = totalesWC.totalGas;

  const gStatIng = document.getElementById('g-stat-ing');
  if (gStatIng) gStatIng.textContent = '$' + totalIng.toLocaleString('es-AR');
  const gStatGas = document.getElementById('g-stat-gas');
  if (gStatGas) gStatGas.textContent = '$' + totalGas.toLocaleString('es-AR');
  const cajGrande = document.getElementById('g-caja-grande');

  const ingEfec  = totalesWC.ingEfec;
  const ingTrans = totalesWC.ingTrans;
  const gasEfec  = totalesWC.gasEfec;
  const gasTrans = totalesWC.gasTrans;
  const cajaEfec  = totalesWC.cajaEfecBruta - totalesWC.descuentosEfec;
  const cajaTrans = totalesWC.cajaTransBruta - totalesWC.descuentosTrans;
  // Ganancia de órdenes — ya registradas en movimientos, no se suman por separado
  const otGan = totalesWC.otGan;
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = '$' + val.toLocaleString('es-AR'); };
  set('g-caja-efec', cajaEfec);
  set('g-caja-trans', cajaTrans);
  // Toda la caja del taller pertenece a WindowsCenter y se muestra neta de descuentos.
  const cajaConOT = totalesWC.netoWC;
  if (cajGrande) { cajGrande.textContent = '$' + cajaConOT.toLocaleString('es-AR'); cajGrande.style.color = cajaConOT >= 0 ? 'white' : '#f85149'; }
  set('g-panel-ing-efec', ingEfec);
  set('g-panel-ing-trans', ingTrans);
  set('g-panel-gas-efec', gasEfec);
  set('g-panel-gas-trans', gasTrans);
  set('g-panel-gan-ordenes', otGan);
  // Stats pills
  set('g-stat-efec', cajaEfec);
  set('g-stat-trans', cajaTrans);

  // ── Panel resumen del dashboard: "Gastos de Costos & Retiro de Caja" (unificado, Adrian+Enzo) ──
  const totalRetiroCaja = adrianRetiroCaja + enzoRetiroCaja;
  const saldoNetoCostosRetiro = totalesWC.totalFavor - totalRetiroCaja; // + = a favor, - = debe

  const elCostosRetiroMov = document.getElementById('g-panel-costos-retiro-mov');
  if (elCostosRetiroMov) elCostosRetiroMov.textContent = (enzoFavorCount + adrianFavorCount + enzoRetiroCount + adrianRetiroCount) + ' mov.';
  set('g-panel-costos-gas', totalesWC.totalFavor);
  set('g-panel-retiro-gas', totalRetiroCaja);
  set('g-panel-costos-retiro-saldo', Math.abs(saldoNetoCostosRetiro));
  const elCostosRetiroSaldo = document.getElementById('g-panel-costos-retiro-saldo');
  if (elCostosRetiroSaldo) elCostosRetiroSaldo.style.color = saldoNetoCostosRetiro >= 0 ? '#bc8cff' : '#f85149';
  const elBarraCostosRetiro = document.getElementById('g-barra-costos-retiro');
  if (elBarraCostosRetiro) {
    const pctCR = totalesWC.totalFavor > 0 ? Math.min(100, Math.max(0, Math.round((1 - totalRetiroCaja/totalesWC.totalFavor)*100))) : 0;
    elBarraCostosRetiro.style.width = pctCR + '%';
    elBarraCostosRetiro.style.background = saldoNetoCostosRetiro >= 0 ? 'linear-gradient(90deg,#3fb950,#2ea043)' : 'linear-gradient(90deg,#f85149,#cf222e)';
  }

  const panIng    = document.getElementById('g-panel-ing');
  const panGas    = document.getElementById('g-panel-gas');
  const panMrg    = document.getElementById('g-panel-margen');
  const panMrgSub = document.getElementById('g-panel-margen-sub');
  const panIngMov = document.getElementById('g-panel-ing-mov');
  const panGasMov = document.getElementById('g-panel-gas-mov');
  if (panIng)    panIng.textContent    = '$' + totalIng.toLocaleString('es-AR');
  if (panGas)    panGas.textContent    = '$' + totalGas.toLocaleString('es-AR');
  const contarMov = tipo => movimientos.filter(m => m.tipo === tipo && (!m.esAmbos || m.montoOriginal > 0)).length;
  if (panIngMov) panIngMov.textContent = contarMov('ingreso') + ' movimientos';
  if (panGasMov) panGasMov.textContent = contarMov('gasto')   + ' movimientos';
  if (panMrg)    panMrg.textContent    = totalIng > 0 ? Math.round((cajaConOT/totalIng)*100) + '%' : '—';
  if (panMrgSub) panMrgSub.textContent = 'sobre ingresos (neto WC)';

  const barIng    = document.getElementById('g-barra-ing');
  const barPct    = document.getElementById('g-barra-pct');
  const barIngLbl = document.getElementById('g-barra-ing-label');
  const barGasLbl = document.getElementById('g-barra-gas-label');
  if (barIng)    barIng.style.width    = totalIng > 0 ? Math.min(100, Math.round((totalIng/(totalIng+totalGas))*100)) + '%' : '0%';
  if (barPct)    barPct.textContent    = totalIng > 0 ? Math.round((cajaConOT/totalIng)*100) + '% margen' : '—';
  if (barIngLbl) barIngLbl.textContent = '$' + totalIng.toLocaleString('es-AR') + ' ingresado';
  if (barGasLbl) barGasLbl.textContent = '$' + totalGas.toLocaleString('es-AR') + ' gastado';
  pintarResumenWindowsCenter(totalesWC);

  // ── Construir filas de órdenes para el historial ──
  const estadoBadgeOT = (estado) => {
    const est = getEstadoOT ? getEstadoOT(estado) : { label: '⏳ Pendiente', color: '#d29922', bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.3)' };
    return `<span class="badge" style="background:${est.bg};color:${est.color};border:1px solid ${est.border}">${est.label}</span>`;
  };
  const personaLabelOT = (p) => {
    return labelPersonaGestion(p === 'ambos' ? 'windowscenter' : p, false, true);
  };

  // Construir entradas sintéticas para las órdenes (para poder filtrarlas igual que movimientos)
  const ordenes = window.ordenesTrabajoData || [];
  const filasOT = ordenes.map(o => ({
    _esOT: true,
    id:        o.id,
    fecha:     fmtFechaCorta ? fmtFechaCorta(o.fechaEntrega || '') : (o.fechaEntrega || '—'),
    tipo:      'ingreso',
    persona:   o.persona || 'windowscenter',
    categoria: 'orden-trabajo',
    desc:      `📦 OT: ${o.cliente} — ${o.desc}`,
    medio:     o.senaMedio || 'efectivo',
    monto:     o.ganancia || 0,
    estado:    o.estado,
    cliente:   o.cliente,
    ganancia:  o.ganancia || 0,
  }));

  const statCount = document.getElementById('g-stat-count');
  if (statCount) statCount.textContent = movimientos.filter(m => !m.esAmbos || m.montoOriginal > 0).length + ordenes.length;

  // Historial
  const tbody         = document.getElementById('g-historial-body');
  const filtroPersona = document.getElementById('g-filtro-persona') ? document.getElementById('g-filtro-persona').value : 'todos';
  const filtroTipo    = document.getElementById('g-filtro-tipo')    ? document.getElementById('g-filtro-tipo').value    : 'todos';
  let filtrados = movimientos.slice();
  filtrados = filtrarPorPeriodo(filtrados);
  if (filtroPersona !== 'todos') filtrados = filtrados.filter(m => m.persona === filtroPersona);
  if (filtroTipo    !== 'todos') filtrados = filtrados.filter(m => m.tipo    === filtroTipo);

  // Filtrar órdenes de la misma manera (sin filtro de período porque usan fecha de entrega, no de movimiento)
  let filasOTFiltradas = filasOT.slice();
  if (filtroPersona !== 'todos') filasOTFiltradas = filasOTFiltradas.filter(o => o.persona === filtroPersona);
  if (filtroTipo === 'gasto') filasOTFiltradas = []; // las OT son siempre ingreso/ganancia

  // Badge de cantidad
  const countEl = document.getElementById('g-filtro-count');
  if (countEl) {
    const visibleMov = filtroPersona === 'todos' ? filtrados.filter(m => !m.esAmbos || m.montoOriginal > 0).length : filtrados.length;
    const total = visibleMov + filasOTFiltradas.length;
    countEl.textContent = total > 0 ? `${total} movimiento${total !== 1 ? 's' : ''}` : '';
  }

  let filtradosVista;
  if (filtroPersona === 'todos') {
    filtradosVista = filtrados.filter(m => !m.esAmbos || m.montoOriginal > 0);
  } else {
    filtradosVista = filtrados;
  }

  // Combinar movimientos + filas OT y renderizar
  const todasFilas = [...filtradosVista, ...filasOTFiltradas];

  if (todasFilas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state" style="padding:40px"><div class="empty-icon">💸</div><h3>Sin movimientos registrados</h3><p>Registrá ingresos y gastos del taller.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = todasFilas.slice().reverse().map(m => {
    if (m._esOT) {
      // Fila de orden de trabajo
      const ganColor = m.ganancia >= 0 ? 'var(--green)' : 'var(--red)';
      return `<tr style="background:rgba(26,127,55,0.04)">
        <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${m.fecha}</td>
        <td>${estadoBadgeOT(m.estado)}</td>
        <td style="font-weight:600">${personaLabelOT(m.persona)}</td>
        <td><span class="badge" style="background:var(--purple-bg);color:var(--purple);border:1px solid rgba(130,80,223,0.2)">📦 Orden de trabajo</span></td>
        <td><span style="font-weight:500">${_escHtml(m.cliente)}</span> <span style="color:var(--ink3);font-size:12px">— ${_escHtml(m.desc.replace('📦 OT: ' + m.cliente + ' — ',''))}</span></td>
        <td><span style="font-size:11px;color:var(--ink3)">Ganancia neta</span></td>
        <td style="text-align:right;font-weight:700;color:${ganColor}">
          ${m.ganancia >= 0 ? '+' : '−'}$${Math.abs(m.ganancia).toLocaleString('es-AR')}
          <div style="font-size:10px;color:var(--ink3);font-weight:400;margin-top:1px">${m.estado === 'cobrado' ? 'cobrado' : m.estado === 'entregada' ? 'entregada' : m.estado === 'en-proceso' ? 'en proceso' : m.estado === 'crear' ? 'por crear' : 'pendiente'}</div>
        </td>
        <td></td>
      </tr>`;
    }
    const esIngreso  = m.tipo === 'ingreso';
    const catLabel   = esIngreso ? (CATEGORIAS_INGRESO[m.categoria] || 'Otro') : (CATEGORIAS_GASTO[m.categoria] || 'Otro');
    const esFiltPers = filtroPersona !== 'todos';
    const personaLabel   = labelPersonaGestion(m.persona, m.esAmbos && !esFiltPers, true);
    const montoMostrar   = ((m.esAmbos && !esFiltPers) ? m.montoOriginal : m.monto) || 0;
    const subLabel       = (m.esAmbos && !esFiltPers) ? `<div style="font-size:10px;color:var(--ink3);margin-top:1px">$${(m.monto || 0).toLocaleString('es-AR')} c/u</div>` : '';
    return `<tr>
      <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${m.fecha || '—'}</td>
      <td><span class="badge ${esIngreso ? 'badge-green' : ''}" style="${esIngreso ? '' : 'background:var(--red-bg);color:var(--red)'}">${esIngreso ? '↑ Ingreso' : '↓ Gasto'}</span></td>
      <td style="font-weight:600">${personaLabel}</td>
      <td><span class="badge badge-blue" style="background:var(--surface);color:var(--ink2);border:1px solid var(--line)">${catLabel}</span></td>
      <td>${_escHtml(m.desc)}</td>
      <td><span class="pago-badge ${m.medio === 'transferencia' ? 'pago-transferencia' : 'pago-efectivo'}">${m.medio === 'transferencia' ? '🏦 Trans.' : '💵 Efec.'}</span></td>
      <td style="text-align:right;font-weight:700;color:${esIngreso ? 'var(--green)' : 'var(--red)'}">
        ${esIngreso ? '+' : '−'}$${montoMostrar.toLocaleString('es-AR')}${subLabel}
      </td>
      <td>
        <button class="action-btn" onclick="confirmarBorrarMovimiento('${m.id}')" title="Eliminar">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');

  // ── GRÁFICO EVOLUCIÓN MENSUAL ──
  renderFinanceChart(movimientos);

  // ── REPORTE RESUMEN (Hoy / Semana / Mes) ──
  renderResumenRapido(movimientos);

  // ── RESUMEN ANUAL ──
  if (typeof renderResumenAnual === 'function') renderResumenAnual(movimientos);

  // ── CHECK NOTIFICACIONES ──
  if (typeof checkNotificaciones === 'function') checkNotificaciones();
};

// ── Chart.js instance holder ──
let _financeChart = null;
let _financeChartHash = '';

function renderFinanceChart(movimientos) {
  const canvas = document.getElementById('chart-finance');
  if (!canvas || typeof Chart === 'undefined') return;

  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase() });
  }

  const ingByMonth = {};
  const gasByMonth = {};
  months.forEach(m => { ingByMonth[m.key] = 0; gasByMonth[m.key] = 0; });

  movimientos.forEach(m => {
    if (m.categoria === 'gasto-costo') return;
    const dt = parseFechaMovimiento(m.fecha);
    if (!dt) return;
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    if (key in ingByMonth) {
      const val = m.monto || 0;
      if (m.tipo === 'ingreso') ingByMonth[key] += val;
      else gasByMonth[key] += val;
    }
  });

  const labels = months.map(m => m.label);
  const ingData = months.map(m => ingByMonth[m.key]);
  const gasData = months.map(m => gasByMonth[m.key]);
  // Línea punteada: mes anterior (shifted +1)
  const prevIngData = ingData.map((v, i) => i > 0 ? ingData[i - 1] : null);

  // Hash para evitar recrear si los datos no cambiaron
  const hash = JSON.stringify(ingData) + JSON.stringify(gasData) + JSON.stringify(prevIngData);
  if (hash === _financeChartHash) return;
  _financeChartHash = hash;

  // Si ya existe chart, solo actualizar datos
  if (_financeChart) {
    _financeChart.data.labels = labels;
    _financeChart.data.datasets[0].data = ingData;
    _financeChart.data.datasets[1].data = gasData;
    _financeChart.data.datasets[2].data = prevIngData;
    _financeChart.update('none');
    return;
  }

  _financeChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: ingData,
          backgroundColor: 'rgba(63, 185, 80, 0.7)',
          borderColor: '#3fb950',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Gastos',
          data: gasData,
          backgroundColor: 'rgba(248, 81, 73, 0.6)',
          borderColor: '#f85149',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Ingresos mes ant.',
          data: prevIngData,
          type: 'line',
          borderColor: 'rgba(130, 80, 223, 0.8)',
          backgroundColor: 'rgba(130, 80, 223, 0.1)',
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 2,
          pointBackgroundColor: 'rgba(130, 80, 223, 0.9)',
          fill: false,
          tension: 0.3,
          spanGaps: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { top: 2, bottom: 0, left: 0, right: 4 } },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1117',
          titleColor: '#e6edf3',
          bodyColor: '#8b949e',
          borderColor: '#30363d',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('es-AR')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8b949e', font: { size: 8, family: "'DM Sans'" }, maxRotation: 0 }
        },
        y: {
          grid: { color: 'rgba(48, 54, 61, 0.3)' },
          ticks: {
            color: '#8b949e',
            font: { size: 8, family: "'DM Sans'" },
            padding: 4,
            callback: (v) => {
              if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
              if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'k';
              return '$' + v;
            }
          },
          beginAtZero: true
        }
      }
    }
  });
}

function renderResumenRapido(movimientos) {
  const now = new Date();

  // Helpers de rango
  const inicioHoy = new Date(now); inicioHoy.setHours(0,0,0,0);
  const inicioSem = new Date(now);
  inicioSem.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  inicioSem.setHours(0,0,0,0);
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  function filtrar(desde, hasta, tipo) {
    return movimientos.filter(m => {
      if (m.tipo !== tipo) return false;
      const f = parseFechaMovimiento(m.fecha);
      if (!f) return false;
      if (f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }

  function totalMonto(arr) {
    return arr.reduce((s, m) => s + (m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0)), 0);
  }

  // Hoy
  const hoyIng = totalMonto(filtrar(inicioHoy, now, 'ingreso'));
  const hoyGas = totalMonto(filtrar(inicioHoy, now, 'gasto'));
  const hoyNeto = hoyIng - hoyGas;

  // Semana
  const semIng = totalMonto(filtrar(inicioSem, now, 'ingreso'));
  const semGas = totalMonto(filtrar(inicioSem, now, 'gasto'));
  const semNeto = semIng - semGas;

  // Mes
  const mesIng = totalMonto(filtrar(inicioMes, now, 'ingreso'));
  const mesGas = totalMonto(filtrar(inicioMes, now, 'gasto'));
  const mesNeto = mesIng - mesGas;

  const fmt = (v) => (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toLocaleString('es-AR');
  const fmtNeto = (v) => (v >= 0 ? '' : '−') + '$' + Math.abs(v).toLocaleString('es-AR');

  const set = (id, val, color) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = val; if (color) el.style.color = color; }
  };

  set('res-hoy-ing', fmt(hoyIng), '#3fb950');
  set('res-hoy-gas', fmt(hoyGas), '#f85149');
  set('res-hoy-neto', fmtNeto(hoyNeto), hoyNeto >= 0 ? '#0d1117' : '#f85149');

  set('res-sem-ing', fmt(semIng), '#3fb950');
  set('res-sem-gas', fmt(semGas), '#f85149');
  set('res-sem-neto', fmtNeto(semNeto), semNeto >= 0 ? '#0d1117' : '#f85149');

  set('res-mes-ing', fmt(mesIng), '#3fb950');
  set('res-mes-gas', fmt(mesGas), '#f85149');
  set('res-mes-neto', fmtNeto(mesNeto), mesNeto >= 0 ? '#0d1117' : '#f85149');
}