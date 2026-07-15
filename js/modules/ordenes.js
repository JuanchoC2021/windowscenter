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
  const id = Date.now().toString();

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
        id: 'costo_' + id + '_' + Math.random().toString(36).substr(2, 9),
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
    document.getElementById('ot-estado').value = 'pendiente';
    otCostosTemp = [];
    renderCostosTemp();
    showToast('✓ Orden de trabajo guardada');
  } catch(e) { showToast('❌ Error al guardar'); console.error(e); }
}

function toggleOrden(id) {
  const body = document.getElementById('ot-body-' + id);
  const hdr  = document.getElementById('ot-hdr-'  + id);
  if (!body) return;
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
  document.getElementById('eot-estado').value        = o.estado;
  document.getElementById('eot-fecha-entrega').value = o.fechaEntrega||'';
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
      try { await deleteDoc(doc(db, "movimientos", saldoMovId)); } catch(e) { /* no existía, ok */ }
    }

    cerrarModalEditarOT();
    showToast('✓ Orden actualizada');
  } catch(e) { showToast('❌ Error: ' + e.message); }
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
        try { await deleteDoc(doc(db, "movimientos", "sena_" + id)); } catch(e) { /* no existía */ }
        try { await deleteDoc(doc(db, "movimientos", "saldo_" + id)); } catch(e) { /* no existía */ }
        showToast('✓ Orden eliminada');
      } catch(e) { showToast('❌ Error: ' + e.message); }
    }
  });
}