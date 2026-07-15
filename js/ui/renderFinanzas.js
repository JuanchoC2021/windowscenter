// ══════════════════════════════════════════════
// RENDER — Panel de Finanzas / Gestión del Taller
// ══════════════════════════════════════════════

function renderMovPersona(persona) {
  const lista = document.getElementById('lista-' + persona);
  if (!lista) return; // este layout no tiene la mini-lista individual por persona
  const mov   = window.movimientos.filter(m => m.persona === persona);
  if (mov.length === 0) { lista.innerHTML = '<div style="padding:30px;text-align:center;color:var(--ink3);font-size:13px">Sin movimientos</div>'; return; }
  lista.innerHTML = mov.slice().reverse().map(m => {
    const esIngreso = m.tipo === 'ingreso';
    const catLabel  = esIngreso ? CATEGORIAS_INGRESO[m.categoria] : CATEGORIAS_GASTO[m.categoria];
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--line);font-size:12px">
      <span style="font-size:16px">${esIngreso ? '↑' : '↓'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.desc}</div>
        <div style="color:var(--ink3);font-size:10px">${catLabel} · ${m.fecha}</div>
      </div>
      <div style="font-weight:700;color:${esIngreso ? 'var(--green)' : 'var(--red)'}">
        ${esIngreso ? '+' : '−'}$${m.monto.toLocaleString('es-AR')}
      </div>
    </div>`;
  }).join('');
}

window.renderGestion = function() {
  const movimientos = window.movimientos || [];

  ['enzo', 'adrian'].forEach(p => {
    const ing      = movimientos.filter(m => m.persona === p && m.tipo === 'ingreso').reduce((s,m) => s+m.monto, 0);
    const gas      = movimientos.filter(m => m.persona === p && m.tipo === 'gasto').reduce((s,m) => s+m.monto, 0);
    // “saldo” de UI lateral debe representar solo favor/debe (gasto-costo - retiro-caja)
    const saldo     = (p === 'adrian') ? (getSaldoPersonaFavorDebe('adrian', movimientos)) : (getSaldoPersonaFavorDebe('enzo', movimientos));
    const movCount = movimientos.filter(m => m.persona === p).length;


    // Guardias para elementos que pueden no existir
    const ingEl = document.getElementById('g-ing-' + p);
    if (ingEl) ingEl.textContent = '$' + ing.toLocaleString('es-AR');
    const gasEl = document.getElementById('g-gas-' + p);
    if (gasEl) gasEl.textContent = '$' + gas.toLocaleString('es-AR');
    const saldoEl = document.getElementById('g-saldo-' + p);
    if (saldoEl) saldoEl.textContent = '$' + saldo.toLocaleString('es-AR');

    const movCountEl = document.getElementById('g-' + p + '-mov-count');
    if (movCountEl) movCountEl.textContent = movCount + ' movimiento' + (movCount !== 1 ? 's' : '');
    if (typeof renderMovPersona === 'function') renderMovPersona(p);

    const ingPanelEl = document.getElementById('g-panel-' + p + '-ing');
    const gasPanelEl = document.getElementById('g-panel-' + p + '-gas');
    const salPanelEl = document.getElementById('g-panel-' + p + '-saldo');
    const movPanelEl = document.getElementById('g-panel-' + p + '-mov');
    const barEl = document.getElementById('g-barra-' + p);
    if (ingPanelEl) ingPanelEl.textContent = '$' + ing.toLocaleString('es-AR');
    if (gasPanelEl) gasPanelEl.textContent = '$' + gas.toLocaleString('es-AR');
    if (salPanelEl) { salPanelEl.textContent = '$' + saldo.toLocaleString('es-AR'); salPanelEl.style.color = saldo >= 0 ? (p === 'enzo' ? '#58a6ff' : '#bc8cff') : '#f85149'; }
    if (movPanelEl) movPanelEl.textContent = movCount + ' mov.';
    if (barEl) {
      const pct = ing > 0 ? Math.min(100, Math.round((1 - gas/ing)*100)) : 0;
      barEl.style.width = Math.max(0, pct) + '%';
      barEl.style.background = pct >= 0 ? 'linear-gradient(90deg,#3fb950,#2ea043)' : 'linear-gradient(90deg,#f85149,#cf222e)';
    }
  });

  // Saldo a favor vs saldo que debe (consumo de favor vs retiros)
  // Querés que en Adrian/Enzo figure:
  // - “Saldo a favor” si los gasto-costo superan los retiros
  // - “Saldo que deben” si los retiros superan los gasto-costo

  // saldo a favor = acumulado de gasto-costo - acumulado de retiros
  // (ambos se registran como tipo="gasto")
  const adrianFavorCostos = (movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'gasto-costo') || []).reduce((s,m) => s + (m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0)), 0);
  const adrianRetiroCaja  = (movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'retiro-caja') || []).reduce((s,m) => s + (m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0)), 0);
  const adrianSaldoNeto   = adrianFavorCostos - adrianRetiroCaja; // + = a favor, - = debe
  const adrianFavorCount  = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'gasto-costo' && (!m.esAmbos || m.montoOriginal > 0)).length;
  const adrianRetiroCount = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'retiro-caja' && (!m.esAmbos || m.montoOriginal > 0)).length;

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


  const enzoFavorCostos = (movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'gasto-costo') || []).reduce((s,m) => s + (m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0)), 0);
  const enzoRetiroCaja  = (movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'retiro-caja') || []).reduce((s,m) => s + (m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0)), 0);
  const enzoSaldoNeto   = enzoFavorCostos - enzoRetiroCaja; // + = a favor, - = debe
  const enzoFavorCount  = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'gasto-costo' && (!m.esAmbos || m.montoOriginal > 0)).length;
  const enzoRetiroCount = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'retiro-caja' && (!m.esAmbos || m.montoOriginal > 0)).length;

  const elEnzoTotalSaldo = document.getElementById('enzo-total-saldo');
  const elEnzoTotalCount = document.getElementById('enzo-total-count');

  if (elEnzoTotalSaldo) {
    elEnzoTotalSaldo.textContent = fmtSaldo(enzoSaldoNeto);
    elEnzoTotalSaldo.style.color = enzoSaldoNeto >= 0 ? '#58a6ff' : '#f85149';
  }
  if (elEnzoTotalCount) elEnzoTotalCount.textContent = (enzoRetiroCount + enzoFavorCount);


  const montoGlobal = m => m.esAmbos ? (m.montoOriginal || 0) : m.monto;
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
  const otGanCobradas  = 0;
  const otGanPendientes= 0;
  const otGan          = totalesWC.otGan;
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = '$' + val.toLocaleString('es-AR'); };
  set('g-caja-efec', cajaEfec);
  set('g-caja-trans', cajaTrans);
  // Toda la caja del taller pertenece a WindowsCenter y se muestra neta de descuentos.
  const cajaConOT = totalesWC.netoWC;
  if (cajGrande) { cajGrande.textContent = '$' + cajaConOT.toLocaleString('es-AR'); cajGrande.style.color = cajaConOT >= 0 ? 'white' : '#f85149'; }
  const statCajaOT = document.getElementById('g-stat-caja'); if (statCajaOT) statCajaOT.textContent = '$' + cajaConOT.toLocaleString('es-AR');
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
    if (estado === 'cobrado') return `<span class="badge badge-green">✅ Cobrado</span>`;
    if (estado === 'senal')   return `<span class="badge badge-blue">💰 Con seña</span>`;
    return `<span class="badge badge-amber">⏳ Pendiente</span>`;
  };
  const personaLabelOT = (p) => {
    return labelPersonaGestion(p === 'ambos' ? 'windowscenter' : p, false, true);
  };

  // Construir entradas sintéticas para las órdenes (para poder filtrarlas igual que movimientos)
  const ordenes = window.ordenesTrabajoData || [];
  const filasOT = ordenes.map(o => ({
    _esOT: true,
    id:        o.id,
    fecha:     o.fechaEntrega || '—',
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
        <td><span style="font-weight:500">${m.cliente}</span> <span style="color:var(--ink3);font-size:12px">— ${m.desc.replace('📦 OT: ' + m.cliente + ' — ','')}</span></td>
        <td><span style="font-size:11px;color:var(--ink3)">Ganancia neta</span></td>
        <td style="text-align:right;font-weight:700;color:${ganColor}">
          ${m.ganancia >= 0 ? '+' : '−'}$${Math.abs(m.ganancia).toLocaleString('es-AR')}
          <div style="font-size:10px;color:var(--ink3);font-weight:400;margin-top:1px">${m.estado === 'cobrado' ? 'cobrado' : m.estado === 'senal' ? 'con seña' : 'pendiente'}</div>
        </td>
        <td></td>
      </tr>`;
    }
    const esIngreso  = m.tipo === 'ingreso';
    const catLabel   = esIngreso ? CATEGORIAS_INGRESO[m.categoria] : CATEGORIAS_GASTO[m.categoria];
    const esFiltPers = filtroPersona !== 'todos';
    const personaLabel   = labelPersonaGestion(m.persona, m.esAmbos && !esFiltPers, true);
    const montoMostrar   = (m.esAmbos && !esFiltPers) ? m.montoOriginal : m.monto;
    const subLabel       = (m.esAmbos && !esFiltPers) ? `<div style="font-size:10px;color:var(--ink3);margin-top:1px">$${m.monto.toLocaleString('es-AR')} c/u</div>` : '';
    return `<tr>
      <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${m.fecha}</td>
      <td><span class="badge ${esIngreso ? 'badge-green' : ''}" style="${esIngreso ? '' : 'background:var(--red-bg);color:var(--red)'}">${esIngreso ? '↑ Ingreso' : '↓ Gasto'}</span></td>
      <td style="font-weight:600">${personaLabel}</td>
      <td><span class="badge badge-blue" style="background:var(--surface);color:var(--ink2);border:1px solid var(--line)">${catLabel}</span></td>
      <td>${m.desc}</td>
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
};