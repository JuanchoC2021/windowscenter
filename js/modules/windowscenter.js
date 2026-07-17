// ══════════════════════════════════════════════
// WINDOWSCENTER — caja de la empresa y descuentos
// ══════════════════════════════════════════════

const WC_TIPOS = {
  'gasto-empresa':       '🔧 Gasto empresa',
  'otro':                '📋 Otro',
};

// ── TOTALES DE CAJA (usado por renderGestion y renderDescuentosWC) ──
function getTotalesWindowsCenter() {
  const movimientos = window.movimientos || [];
  const ordenes = window.ordenesTrabajoData || [];
  const descuentos = window.descuentosWC || [];
  const montoGlobal = m => m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0);
  const movsVis = movimientos.filter(m => !m.esAmbos || m.montoOriginal > 0);
  const calcMedio = (tipo, medio) => movsVis.filter(m => m.tipo === tipo && m.medio === medio).reduce((s,m) => s + montoGlobal(m), 0);

  const totalIng = movimientos.filter(m => m.tipo === 'ingreso').reduce((s,m) => s + montoGlobal(m), 0);
  // Excluir tanto gasto-costo como retiro-caja de totalGas:
  // - gasto-costo: es saldo a favor de Adrian/Enzo, no sale de la caja directamente
  // - retiro-caja: se descuenta solo via excedenteAdrian/Enzo para evitar doble conteo
  const totalGas = movimientos.filter(m => m.tipo === 'gasto' && m.categoria !== 'gasto-costo' && m.categoria !== 'retiro-caja').reduce((s,m) => s + montoGlobal(m), 0);

  // Los "gastos de costos" NO se descuentan de la caja del taller.
  // Se consideran saldo a favor (plata que WC debe a Adrian/Enzo).
  const favorAdrian = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'gasto-costo').reduce((s,m) => s + montoGlobal(m), 0);
  const favorEnzo = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'gasto-costo').reduce((s,m) => s + montoGlobal(m), 0);

  // Retiro de caja sí impacta la caja del taller.
  // Si el retiro excede el saldo a favor, el excedente queda como deuda (a cobrar por WindowsCenter).
  const retiroCajaAdrian = movimientos.filter(m => m.persona === 'adrian' && m.tipo === 'gasto' && m.categoria === 'retiro-caja').reduce((s,m) => s + montoGlobal(m), 0);
  const retiroCajaEnzo = movimientos.filter(m => m.persona === 'enzo' && m.tipo === 'gasto' && m.categoria === 'retiro-caja').reduce((s,m) => s + montoGlobal(m), 0);

  // Todos los ingresos de OTs ya se registran como movimientos en caja:
  // - La seña se registra al crear la orden (movimiento id: 'sena_' + id)
  // - El saldo restante se registra al cobrar (movimiento id: 'saldo_' + id)
  // No hace falta sumar nada adicional: todo está en totalIng y totalGas.
  const otGan = 0;
  const cajaBruta = (totalIng - totalGas) + otGan;
  const totalDescuentos = descuentos.reduce((s,d) => s + (d.monto || 0), 0);

  // cuánto se descuenta realmente de la caja del taller en el retiro:
  // descuenta primero el favor; si no alcanza, se descuenta el resto.
  const excedenteAdrian = Math.max(0, retiroCajaAdrian - favorAdrian);
  const excedenteEnzo = Math.max(0, retiroCajaEnzo - favorEnzo);
  const totalExcedente = excedenteAdrian + excedenteEnzo;

  const netoWC = cajaBruta - totalDescuentos - totalExcedente;

  const descuentosEfec = descuentos.filter(d => d.medio === 'efectivo').reduce((s,d) => s + (d.monto || 0), 0);
  const descuentosTrans = descuentos.filter(d => d.medio === 'transferencia').reduce((s,d) => s + (d.monto || 0), 0);

  const excedenteDebeAdrian = excedenteAdrian; // debe a WC si excede
  const excedenteDebeEnzo = excedenteEnzo;

  // Para compatibilidad con el resto del código (nombres anteriores), devolvemos como "deuda"
  // el excedente (cuando el retiro fue mayor al favor acumulado).
  return {
    totalIng,
    totalGas,
    otGan,
    cajaBruta,
    totalDescuentos,
    netoWC,
    deudaAdrian: excedenteDebeAdrian,
    deudaEnzo: excedenteDebeEnzo,
    totalDeuda: excedenteDebeAdrian + excedenteDebeEnzo,

    favorAdrian,
    favorEnzo,
    totalFavor: favorAdrian + favorEnzo,
    totalExcedente,

    ingEfec: calcMedio('ingreso','efectivo'),
    ingTrans: calcMedio('ingreso','transferencia'),
    gasEfec: calcMedio('gasto','efectivo'),
    gasTrans: calcMedio('gasto','transferencia'),
    descuentosEfec,
    descuentosTrans,
    cajaEfecBruta: calcMedio('ingreso','efectivo') - calcMedio('gasto','efectivo'),
    cajaTransBruta: calcMedio('ingreso','transferencia') - calcMedio('gasto','transferencia'),
  };
}

function pintarResumenWindowsCenter(totales) {
  const t = totales || getTotalesWindowsCenter();
  const setMonto = (id, val, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '$' + val.toLocaleString('es-AR');
    if (color) el.style.color = color;
  };
  setMonto('wc-caja-bruta', t.cajaBruta, '#3fb950');
  setMonto('wc-total-descuentos', t.totalDescuentos, '#f85149');
  setMonto('wc-neto', t.netoWC, t.netoWC >= 0 ? '#79c0ff' : '#f85149');
  setMonto('wc-detail-caja', t.cajaBruta, '#3fb950');
  setMonto('wc-detail-descuentos', t.totalDescuentos, '#f85149');
  setMonto('wc-detail-neto', t.netoWC, t.netoWC >= 0 ? '#79c0ff' : '#f85149');
  const lista = window.descuentosWC || [];
  const descCountEl = document.getElementById('wc-desc-count');
  if (descCountEl) descCountEl.textContent = lista.length + ' descuento' + (lista.length !== 1 ? 's' : '');
  const detailCountEl = document.getElementById('wc-detail-desc-count');
  if (detailCountEl) detailCountEl.textContent = lista.length + ' descuento' + (lista.length !== 1 ? 's' : '') + ' registrado' + (lista.length !== 1 ? 's' : '');
}

// ── CRUD DESCUENTOS A WINDOWSCENTER ──
async function addDescuentoWC() {
  const tipo  = document.getElementById('wc-tipo').value;
  const desc  = document.getElementById('wc-desc').value.trim();
  const monto = parseFloat(document.getElementById('wc-monto').value);
  const medio = document.getElementById('wc-medio').value;
  const fechaInput = document.getElementById('wc-fecha-input').value.trim();
  if (!desc)          { showToast('⚠️ Ingresá una descripción'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Ingresá un monto válido'); return; }
  const hoy = new Date();
  const fecha = fechaInput || hoy.toLocaleDateString('es-AR') + ' ' + hoy.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  try {
    window._fb.setSyncStatus('syncing','Guardando…');
    const { setDoc, doc, db } = window._fb;
    const id = crypto.randomUUID();
    await setDoc(doc(db,'descuentosWC',id), { id, fecha, tipo, desc, monto, medio });
    window._fb.setSyncStatus('synced','Sincronizado ✓');
    document.getElementById('wc-desc').value = '';
    document.getElementById('wc-monto').value = '';
    document.getElementById('wc-fecha-input').value = '';
    showToast('✓ Descuento registrado a WindowsCenter');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error: '+e.message); }
}

async function borrarDescuentoWC(id) {
  try {
    window._fb.setSyncStatus('syncing','Eliminando…');
    const { deleteDoc, doc, db } = window._fb;
    await deleteDoc(doc(db,'descuentosWC',id.toString()));
    window._fb.setSyncStatus('synced','Sincronizado ✓');
    showToast('✓ Descuento eliminado');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error: '+e.message); }
}

function confirmarBorrarDescuentoWC(id) {
  const d = (window.descuentosWC||[]).find(x=>x.id===id);
  mostrarConfirm({
    icon:'🗑️', title:'¿Eliminar descuento?',
    msg: `"${d ? d.desc : 'este descuento'}" se eliminará del historial.`,
    btnLabel:'Eliminar', btnClass:'btn-outline',
    onOk: () => borrarDescuentoWC(id)
  });
}

async function limpiarDescuentosWC() {
  const lista = window.descuentosWC||[];
  if (lista.length === 0) { showToast('⚠️ No hay descuentos para eliminar'); return; }
  mostrarConfirm({
    icon:'🗑️', title:'¿Borrar todos los descuentos?',
    msg:'Se eliminarán todos los descuentos registrados a WindowsCenter.',
    btnLabel:'Borrar todo', btnClass:'btn-outline',
    onOk: async () => {
      try {
        window._fb.setSyncStatus('syncing','Limpiando…');
        const { getDocs, doc, db, collection, writeBatch } = window._fb;
        const snap = await getDocs(collection(db,'descuentosWC'));
        if (snap.empty) { window._fb.setSyncStatus('synced','Sincronizado ✓'); return; }
        const chunks = []; let batch = writeBatch(db); let count = 0;
        snap.docs.forEach(d => { batch.delete(doc(db,'descuentosWC',d.id)); count++; if(count===500){chunks.push(batch);batch=writeBatch(db);count=0;} });
        chunks.push(batch);
        for (const b of chunks) await b.commit();
        window._fb.setSyncStatus('synced','Sincronizado ✓');
        showToast('✓ Descuentos eliminados');
      } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error: '+e.message); }
    }
  });
}