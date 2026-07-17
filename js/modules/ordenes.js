// ══════════════════════════════════════════════
// ÓRDENES DE TRABAJO
// ══════════════════════════════════════════════

let otCostosTemp = []; // costos en construcción antes de guardar

function agregarCostoOT() {
  const desc  = document.getElementById('ot-costo-desc').value.trim();
  const monto = parseFloat(document.getElementById('ot-costo-monto').value);
  const origen = document.getElementById('ot-costo-origen').value;
  const medio = document.getElementById('ot-costo-medio').value;
  if (!desc || !monto || monto <= 0) { showToast('⚠️ Ingresá concepto y monto'); return; }
  otCostosTemp.push({ desc, monto, origen, medio });
  document.getElementById('ot-costo-desc').value  = '';
  document.getElementById('ot-costo-monto').value = '';
  renderCostosTemp();
}

function quitarCostoTemp(i) {
  otCostosTemp.splice(i, 1);
  renderCostosTemp();
}

async function guardarOrdenTrabajo() {
  const fechaRegistro = document.getElementById('ot-fecha-registro').value.trim() || new Date().toISOString().split('T')[0];
  const cliente      = document.getElementById('ot-cliente').value.trim();
  const desc         = document.getElementById('ot-desc').value.trim();
  const persona      = document.getElementById('ot-persona').value;
  const venta        = parseFloat(document.getElementById('ot-venta').value) || 0;
  const sena         = parseFloat(document.getElementById('ot-sena').value)  || 0;
  const senaMedio    = document.getElementById('ot-sena-medio').value;
  const saldoMedio   = document.getElementById('ot-saldo-medio').value;
  const estado       = document.getElementById('ot-estado').value;
  const fechaEntrega = document.getElementById('ot-fecha-entrega').value.trim();
  if (!cliente) { showToast('⚠️ Ingresá el nombre del cliente'); return; }
  if (!desc)    { showToast('⚠️ Ingresá una descripción'); return; }
  if (venta <= 0) { showToast('⚠️ Ingresá el precio de venta'); return; }

  const totalCostos = otCostosTemp.reduce((s,c) => s+c.monto, 0);
  const ganancia    = venta - totalCostos;
  const saldo       = venta - sena;
  const fechaStr    = new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const id = crypto.randomUUID();

  const orden = {
    id, cliente, desc, persona, venta, sena, senaMedio, saldoMedio,
    estado, fechaEntrega, fechaRegistro, fechaCreacion: fechaStr,
    costos: [...otCostosTemp], totalCostos, ganancia, saldo
  };

  try {
    window._fb.setSyncStatus('syncing', 'Guardando…');
    const { setDoc, doc, db } = window._fb;
    await setDoc(doc(db, "ordenesTrabajo", id), orden);

    // Registrar seña en caja si existe
    if (sena > 0) {
      const { collection } = window._fb;
      const movCol = collection(db, "movimientos");
      const senaMov = {
        id: 'sena_' + id,
        fecha: new Date(fechaRegistro).toLocaleDateString('es-AR'),
        tipo: 'ingreso',
        persona: 'windowscenter',
        categoria: 'venta-abertura',
        desc: `Seña - ${cliente}: ${desc}`,
        monto: sena,
        medio: senaMedio,
        esAmbos: false,
        montoOriginal: sena,
        origen: 'orden-trabajo'
      };
      await setDoc(doc(db, "movimientos", senaMov.id), senaMov);
    }

    // Si se crea directamente como cobrado, registrar el saldo restante como ingreso
    if (estado === 'cobrado') {
      const saldoRestante = venta - sena;
      if (saldoRestante > 0) {
        const fechaHoy = new Date(fechaRegistro).toLocaleDateString('es-AR');
        const saldoMov = {
          id: 'saldo_' + id,
          fecha: fechaHoy,
          tipo: 'ingreso',
          persona: 'windowscenter',
          categoria: 'venta-abertura',
          desc: `Saldo cobrado - ${cliente}: ${desc}`,
          monto: saldoRestante,
          medio: saldoMedio,
          esAmbos: false,
          montoOriginal: saldoRestante,
          origen: 'orden-trabajo'
        };
        await setDoc(doc(db, "movimientos", saldoMov.id), saldoMov);
      }
    }

    // Registrar costos de Adrian/Enzo en finanzas como saldo a favor
    const costosPorPersona = otCostosTemp.filter(c => c.origen !== 'windowscenter');
    for (const costo of costosPorPersona) {
      const { collection } = window._fb;
      const movCol = collection(db, "movimientos");
      const costoMov = {
        id: 'costo_' + id + '_' + Math.random().toString(36).slice(2, 11),
        fecha: new Date(fechaRegistro).toLocaleDateString('es-AR'),
        tipo: 'gasto',
        persona: costo.origen,
        categoria: 'gasto-costo',
        desc: `Costo orden: ${cliente} - ${costo.desc}`,
        monto: costo.monto,
        medio: costo.medio,
        esAmbos: false,
        montoOriginal: costo.monto,
        origen: 'orden-trabajo'
      };
      await setDoc(doc(db, "movimientos", costoMov.id), costoMov);
    }

    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
    // Limpiar form
    ['ot-cliente','ot-desc','ot-venta','ot-fecha-entrega','ot-fecha-registro'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('ot-sena').value   = '0';
    document.getElementById('ot-estado').value = 'crear';
    otCostosTemp = [];
    renderCostosTemp();
    showToast('✓ Orden de trabajo guardada');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error al guardar'); console.error(e); }
}

function toggleOrden(id) {
  const body = document.getElementById('ot-body-' + id);
  const hdr  = document.getElementById('ot-hdr-'  + id);
  if (!body || !hdr) return;
  const open = body.classList.toggle('open');
  hdr.classList.toggle('open', open);
}

function abrirEditarOT(id) {
  const o = (window.ordenesTrabajoData||[]).find(x => x.id === id);
  if (!o) return;
  document.getElementById('eot-id').value            = o.id;
  document.getElementById('eot-cliente').value       = o.cliente;
  document.getElementById('eot-desc').value          = o.desc;
  document.getElementById('eot-persona').value       = o.persona === 'ambos' ? 'windowscenter' : (o.persona || 'windowscenter');
  document.getElementById('eot-estado').value        = o.estado || 'pendiente';
  // Convertir fecha entrega a formato date (YYYY-MM-DD)
  const fe = o.fechaEntrega || '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(fe)) {
    document.getElementById('eot-fecha-entrega').value = fe;
  } else if (fe) {
    const dt = parseFechaOT(fe);
    document.getElementById('eot-fecha-entrega').value = dt ? dt.toISOString().split('T')[0] : '';
  } else {
    document.getElementById('eot-fecha-entrega').value = '';
  }
  document.getElementById('eot-venta').value         = o.venta;
  document.getElementById('eot-sena').value          = o.sena;
  document.getElementById('eot-sena-medio').value    = o.senaMedio||'efectivo';
  document.getElementById('eot-saldo-medio').value   = o.saldoMedio||'efectivo';
  document.getElementById('modal-editar-ot').classList.add('open');
}

function cerrarModalEditarOT() {
  document.getElementById('modal-editar-ot').classList.remove('open');
}

async function guardarEdicionOT() {
  const id           = document.getElementById('eot-id').value;
  const cliente      = document.getElementById('eot-cliente').value.trim();
  const desc         = document.getElementById('eot-desc').value.trim();
  const persona      = document.getElementById('eot-persona').value;
  const estado       = document.getElementById('eot-estado').value;
  const fechaEntrega = document.getElementById('eot-fecha-entrega').value.trim();
  const venta        = parseFloat(document.getElementById('eot-venta').value)||0;
  const sena         = parseFloat(document.getElementById('eot-sena').value)||0;
  const senaMedio    = document.getElementById('eot-sena-medio').value;
  const saldoMedio   = document.getElementById('eot-saldo-medio').value;
  const o            = (window.ordenesTrabajoData||[]).find(x => x.id === id);
  if (!o) return;
  const totalCostos = (o.costos||[]).reduce((s,c)=>s+c.monto,0);
  const ganancia    = venta - totalCostos;
  const saldo       = venta - sena;
  const updated     = { ...o, cliente, desc, persona, estado, fechaEntrega, venta, sena, senaMedio, saldoMedio, totalCostos, ganancia, saldo };
  try {
    const { setDoc, doc, db, deleteDoc } = window._fb;
    await setDoc(doc(db, "ordenesTrabajo", id), updated);

    const estadoAnterior = o.estado;
    const saldoMovId = 'saldo_' + id;

    // Si cambia A cobrado: registrar el saldo restante (venta − seña) como ingreso en caja
    if (estado === 'cobrado' && estadoAnterior !== 'cobrado') {
      const saldoRestante = venta - sena;
      if (saldoRestante > 0) {
        const fechaHoy = new Date().toLocaleDateString('es-AR');
        const saldoMov = {
          id: saldoMovId,
          fecha: fechaHoy,
          tipo: 'ingreso',
          persona: 'windowscenter',
          categoria: 'venta-abertura',
          desc: `Saldo cobrado - ${cliente}: ${desc}`,
          monto: saldoRestante,
          medio: saldoMedio,
          esAmbos: false,
          montoOriginal: saldoRestante,
          origen: 'orden-trabajo'
        };
        await setDoc(doc(db, "movimientos", saldoMovId), saldoMov);
      }
    }

    // Si DEJA de estar cobrado: eliminar el movimiento de saldo si existía
    if (estadoAnterior === 'cobrado' && estado !== 'cobrado') {
      try { await deleteDoc(doc(db, "movimientos", saldoMovId)); } catch(e) { console.warn('Saldo mov no encontrado:', saldoMovId); }
    }

    cerrarModalEditarOT();
    showToast('✓ Orden actualizada');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error: ' + e.message); console.error('guardarEdicionOT:', e); }
}

function confirmarBorrarOT(id) {
  const o = (window.ordenesTrabajoData||[]).find(x => x.id === id);
  mostrarConfirm({
    icon: '🗑️', title: '¿Eliminar orden?',
    msg: `La orden de "${o ? o.cliente : 'este cliente'}" se eliminará permanentemente.`,
    btnLabel: 'Eliminar', btnClass: 'btn-outline',
    onOk: async () => {
      try {
        const { deleteDoc, doc, db } = window._fb;
        // Eliminar la orden
        await deleteDoc(doc(db, "ordenesTrabajo", id));
        // Eliminar movimientos asociados (seña y saldo cobrado)
        try { await deleteDoc(doc(db, "movimientos", "sena_" + id)); } catch(e) { console.warn('Seña mov no encontrado:', id); }
        try { await deleteDoc(doc(db, "movimientos", "saldo_" + id)); } catch(e) { console.warn('Saldo mov no encontrado:', id); }
        showToast('✓ Orden eliminada');
      } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error: ' + e.message); console.error('confirmarBorrarOT:', e); }
    }
  });
}

// ── DUPLICAR ORDEN ──
function duplicarOT(id) {
  const o = (window.ordenesTrabajoData||[]).find(x => x.id === id);
  if (!o) return;
  switchGMain('ordenes');
  setTimeout(() => {
    document.getElementById('ot-cliente').value       = o.cliente;
    document.getElementById('ot-desc').value          = o.desc;
    document.getElementById('ot-persona').value       = o.persona || 'windowscenter';
    document.getElementById('ot-venta').value         = o.venta;
    document.getElementById('ot-sena').value          = '0';
    document.getElementById('ot-sena-medio').value    = o.senaMedio || 'efectivo';
    document.getElementById('ot-saldo-medio').value   = o.saldoMedio || 'efectivo';
    document.getElementById('ot-estado').value        = 'crear';
    document.getElementById('ot-fecha-entrega').value = '';
    otCostosTemp = (o.costos || []).map(c => ({ ...c }));
    renderCostosTemp();
    showToast('📋 Orden duplicada — revisá los datos y guardá');
    const form = document.getElementById('ot-cliente');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// ── EDITAR COSTOS DE OT EXISTENTE ──
let ecotCostosTemp = [];

function abrirEditarCostosOT(id) {
  const o = (window.ordenesTrabajoData||[]).find(x => x.id === id);
  if (!o) return;
  document.getElementById('ecot-id').value = o.id;
  document.getElementById('ecot-cliente-label').textContent = `${o.cliente} — ${o.desc}`;
  ecotCostosTemp = (o.costos || []).map(c => ({ ...c }));
  renderEcotCostosTemp();
  document.getElementById('modal-editar-costos-ot').classList.add('open');
}

function cerrarModalEditarCostosOT() {
  document.getElementById('modal-editar-costos-ot').classList.remove('open');
  ecotCostosTemp = [];
}

function renderEcotCostosTemp() {
  const lista = document.getElementById('ecot-costos-lista');
  const totalEl = document.getElementById('ecot-total-costos');
  if (ecotCostosTemp.length === 0) {
    lista.innerHTML = '<div style="font-size:12px;color:var(--ink3);text-align:center;padding:8px">Sin costos</div>';
    if (totalEl) totalEl.textContent = '$0';
    return;
  }
  const origenLabel = { windowscenter: '🏢 WC', adrian: '👤 Adrian', enzo: '👤 Enzo' };
  lista.innerHTML = ecotCostosTemp.map((c, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:white;border:1px solid var(--line);border-radius:6px;font-size:12px;margin-bottom:4px">
      <span style="flex:1">${c.desc}</span>
      <span style="font-size:10px;color:rgba(100,116,139,0.8);background:rgba(100,116,139,0.1);padding:2px 6px;border-radius:4px">${origenLabel[c.origen] || 'WC'}</span>
      <span class="pago-badge ${c.medio === 'transferencia' ? 'pago-transferencia' : 'pago-efectivo'}">${c.medio === 'transferencia' ? '🏦' : '💵'}</span>
      <span style="font-weight:700;color:var(--red)">−$${(c.monto || 0).toLocaleString('es-AR')}</span>
      <button class="action-btn" onclick="quitarCostoExistenteOT(${i})" style="padding:3px">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg>
      </button>
    </div>`).join('');
  const total = ecotCostosTemp.reduce((s,c) => s + c.monto, 0);
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-AR');
}

function agregarCostoExistenteOT() {
  const desc  = document.getElementById('ecot-costo-desc').value.trim();
  const monto = parseFloat(document.getElementById('ecot-costo-monto').value);
  const origen = document.getElementById('ecot-costo-origen').value;
  const medio = document.getElementById('ecot-costo-medio').value;
  if (!desc || !monto || monto <= 0) { showToast('⚠️ Ingresá concepto y monto'); return; }
  ecotCostosTemp.push({ desc, monto, origen, medio });
  document.getElementById('ecot-costo-desc').value  = '';
  document.getElementById('ecot-costo-monto').value = '';
  renderEcotCostosTemp();
}

function quitarCostoExistenteOT(i) {
  ecotCostosTemp.splice(i, 1);
  renderEcotCostosTemp();
}

async function guardarCostosOT() {
  const id  = document.getElementById('ecot-id').value;
  const o   = (window.ordenesTrabajoData||[]).find(x => x.id === id);
  if (!o) return;

  // Calcular totales viejos y nuevos
  const viejoTotalCostos = (o.costos || []).reduce((s,c) => s + c.monto, 0);
  const nuevoTotalCostos = ecotCostosTemp.reduce((s,c) => s + c.monto, 0);
  const diffCostos = nuevoTotalCostos - viejoTotalCostos;
  const nuevaGanancia = o.venta - nuevoTotalCostos;

  const updated = { ...o, costos: [...ecotCostosTemp], totalCostos: nuevoTotalCostos, ganancia: nuevaGanancia };

  try {
    const { setDoc, doc, db, deleteDoc } = window._fb;

    // Borrar movimientos viejos de costos de esta OT
    if (o.costos && o.costos.length > 0) {
      const oldCostoIds = o.costos.map((c, i) => 'costo_' + o.id + '_' + i);
      // También buscar por prefijo para movimientos con IDs aleatorios
      for (const mov of (window.movimientos || [])) {
        if (mov.origen === 'orden-trabajo' && mov.categoria === 'gasto-costo' && mov.desc && mov.desc.includes(o.cliente)) {
          try { await deleteDoc(doc(db, "movimientos", mov.id)); } catch(e) { /* ok */ }
        }
      }
    }

    // Crear nuevos movimientos de costos para Adrian/Enzo
    for (let i = 0; i < ecotCostosTemp.length; i++) {
      const costo = ecotCostosTemp[i];
      if (costo.origen === 'windowscenter') continue;
      const costoMov = {
        id: 'costo_' + o.id + '_' + i,
        fecha: o.fechaRegistro || new Date().toLocaleDateString('es-AR'),
        tipo: 'gasto',
        persona: costo.origen,
        categoria: 'gasto-costo',
        desc: `Costo orden: ${o.cliente} - ${costo.desc}`,
        monto: costo.monto,
        medio: costo.medio,
        esAmbos: false,
        montoOriginal: costo.monto,
        origen: 'orden-trabajo'
      };
      await setDoc(doc(db, "movimientos", costoMov.id), costoMov);
    }

    // Guardar orden actualizada
    await setDoc(doc(db, "ordenesTrabajo", id), updated);

    cerrarModalEditarCostosOT();
    showToast('✓ Costos actualizados');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error: ' + e.message); }
}