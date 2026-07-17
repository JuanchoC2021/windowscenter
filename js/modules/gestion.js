// ══════════════════════════════════════════════
// GESTIÓN DEL TALLER — movimientos (ingresos/gastos)
// ══════════════════════════════════════════════

const CATEGORIAS_INGRESO = {
  'venta-abertura': 'Venta abertura',
  'colocacion':     'Colocación',
  'ingreso-otro':   'Otro ingreso'
};
const CATEGORIAS_GASTO = {
  'ventanas-costo': 'Ventanas (costo)',
  'accesorios':     'Accesorios',
  'materiales':     'Materiales',
  'comida':         'Comida',
  'combustible':    'Combustible',
  'herramientas':   'Herramientas',
  'retiro-caja':    'Retiro de caja',
  'gasto-costo':    'Gasto de costos',
  'gasto-otro':     'Otro gasto'
};

function labelPersonaGestion(persona, esAmbos=false, html=false) {
  if (persona === 'windowscenter') return html ? '🏢 WindowsCenter' : 'WindowsCenter';
  return persona || '—';
}

// ── SWITCH TAB INGRESO / GASTO (formulario principal) ──
let gTabActivo = 'ingreso';

function switchGTab(tab) {
  gTabActivo = tab;
  document.getElementById('gtab-ingreso').classList.toggle('active', tab === 'ingreso');
  document.getElementById('gtab-gasto').classList.toggle('active', tab === 'gasto');
  const sel = document.getElementById('g-categoria');
  sel.innerHTML = '';
  const cats = tab === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
  Object.entries(cats).forEach(([v,l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; sel.appendChild(o); });
}

// ── AGREGAR MOVIMIENTO (guarda en Firestore) ──
async function addMovimiento() {
  const persona   = document.getElementById('g-persona').value;
  const categoria = document.getElementById('g-categoria').value;
  const desc      = document.getElementById('g-desc').value.trim();
  const monto     = parseFloat(document.getElementById('g-monto').value);
  const medio     = document.getElementById('g-medio').value;
  const fechaInput = document.getElementById('g-fecha').value;
  const tipo      = gTabActivo;
  if (!desc)            { showToast('⚠️ Ingresá una descripción'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Ingresá un monto válido'); return; }

  // Usar fecha del input o la fecha actual
  const hoy2    = fechaInput ? new Date(fechaInput) : new Date();
  const fechaStr = hoy2.toLocaleDateString('es-AR') + ' ' + hoy2.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const fechaSolo = hoy2.toLocaleDateString('es-AR');

  try {
    window._fb.setSyncStatus('syncing', 'Guardando…');
    const { setDoc, doc, db } = window._fb;
    if (persona === 'ambos') {
      const mitad = Math.round(monto / 2);
      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      await setDoc(doc(db, "movimientos", id1), { id: id1, fecha: fechaSolo, tipo, persona: 'enzo',   categoria, desc, monto: mitad, medio, esAmbos: true, montoOriginal: monto });
      await setDoc(doc(db, "movimientos", id2), { id: id2, fecha: fechaSolo, tipo, persona: 'adrian', categoria, desc, monto: mitad, medio, esAmbos: true, montoOriginal: 0 });
    } else {
      const id = crypto.randomUUID();
      await setDoc(doc(db, "movimientos", id), { id, fecha: fechaSolo, tipo, persona, categoria, desc, monto, medio, esAmbos: false, montoOriginal: monto });
    }
    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
    document.getElementById('g-desc').value  = '';
    document.getElementById('g-monto').value = '';
    document.getElementById('g-fecha').value = '';
    showToast(tipo === 'ingreso' ? '✓ Ingreso registrado' : '✓ Gasto registrado');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error al registrar'); console.error(e); }
}

// ── RETIROS Y GASTOS GENÉRICOS (ADRIAN & ENZO) ──
async function addPersonaTransaccion(persona, categoria) {
  const suffix = categoria === 'retiro-caja' ? 'retiro' : 'costo';
  const montoEl = document.getElementById(persona + '-' + suffix + '-monto');
  const medioEl = document.getElementById(persona + '-' + suffix + '-medio');
  const descEl = document.getElementById(persona + '-' + suffix + '-desc');

  // Validación fuerte para evitar que “no registre” por IDs que no existen
  if (!montoEl || !medioEl) {
    showToast('❌ Error interno: faltan campos para ' + persona);
    console.error('[addPersonaTransaccion] missing inputs', { persona, categoria });
    return;
  }

  const monto = parseFloat(montoEl.value);
  const medio = medioEl.value;
  const desc = (descEl?.value || '').trim() || (categoria === 'retiro-caja' ? 'Retiro de caja' : 'Gasto de costos');


  if (!monto || monto <= 0) { showToast('⚠️ Ingresá un monto válido'); return; }
  if (!medio) { showToast('⚠️ Elegí el medio de pago'); return; }

  // Importante: el filtro/renderer usa parseFechaMovimiento que espera dd/mm/yyyy.
  // Como en esta vista guardamos solo fecha, dejamos formato dd/mm/yyyy (es-AR).
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString('es-AR');

  const id = crypto.randomUUID();

  try {
    window._fb.setSyncStatus('syncing', 'Guardando…');
    const { setDoc, doc, db } = window._fb;
    await setDoc(doc(db, "movimientos", id), {
      id,
      fecha,
      tipo: 'gasto',
      persona,
      categoria,
      desc,
      monto,
      medio,
      esAmbos: false,
      montoOriginal: monto
    });
    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
    if (montoEl) montoEl.value = '';
    if (descEl) descEl.value = '';
    const tipoTexto = categoria === 'retiro-caja' ? 'Retiro' : 'Gasto';
    showToast(`✓ ${tipoTexto} de ${persona.charAt(0).toUpperCase() + persona.slice(1)} registrado`);
  } catch(e) {
    window._fb.setSyncStatus('error', 'Error');
    showToast('❌ Error al registrar');
    console.error(e);
  }
}

// ── BORRAR MOVIMIENTO ──
function confirmarBorrarMovimiento(id) {
  const mov = window.movimientos.find(m => m.id === id);
  const nombre = mov ? mov.desc : 'este movimiento';
  mostrarConfirm({
    icon: '🗑️',
    title: '¿Eliminar movimiento?',
    msg: `"${nombre}" se eliminará del historial.`,
    btnLabel: 'Eliminar',
    btnClass: 'btn-outline',
    onOk: () => borrarMovimiento(id)
  });
}

async function borrarMovimiento(id) {
  try {
    window._fb.setSyncStatus('syncing', 'Eliminando…');
    const { deleteDoc, doc, db } = window._fb;
    const mov = window.movimientos.find(m => m.id === id);
    if (mov && mov.esAmbos) {
      // Borrar el par completo: buscar por desc, tipo y fecha (tolerante a variaciones)
      // Si el movimiento tiene montoOriginal > 0 es el "principal", el par tiene montoOriginal === 0
      // Si el movimiento tiene montoOriginal === 0 es el "secundario", el principal tiene montoOriginal > 0
      const pares = window.movimientos.filter(m =>
        m.esAmbos &&
        m.tipo === mov.tipo &&
        m.desc === mov.desc &&
        m.fecha === mov.fecha &&
        m.categoria === mov.categoria
      );
      if (pares.length > 0) {
        for (const p of pares) {
          await deleteDoc(doc(db, "movimientos", p.id.toString()));
        }
      } else {
        // Fallback: borrar solo el encontrado
        await deleteDoc(doc(db, "movimientos", id.toString()));
      }
    } else {
      await deleteDoc(doc(db, "movimientos", id.toString()));
    }
    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
    showToast('✓ Movimiento eliminado');
  } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error al eliminar: ' + e.message); console.error('borrarMovimiento error:', e); }
}

// ── LIMPIAR GESTIÓN ──
async function limpiarGestion() {
  if (!window.movimientos || window.movimientos.length === 0) { showToast('⚠️ No hay movimientos para eliminar'); return; }
  mostrarConfirm({
    icon: '🗑️',
    title: '¿Borrar todos los movimientos?',
    msg: 'Se eliminarán todos los ingresos y gastos del historial. Esta acción no se puede deshacer.',
    btnLabel: 'Borrar todo',
    btnClass: 'btn-outline',
    onOk: async () => {
      try {
        window._fb.setSyncStatus('syncing', 'Limpiando…');
        const { getDocs, doc, db, collection, writeBatch } = window._fb;
        const snap = await getDocs(collection(db, "movimientos"));
        if (snap.empty) { window._fb.setSyncStatus('synced', 'Sincronizado ✓'); showToast('⚠️ No hay movimientos'); return; }
        const chunks = [];
        let batch = writeBatch(db);
        let count = 0;
        snap.docs.forEach(d => {
          batch.delete(doc(db, "movimientos", d.id));
          count++;
          if (count === 500) { chunks.push(batch); batch = writeBatch(db); count = 0; }
        });
        chunks.push(batch);
        for (const b of chunks) await b.commit();
        window._fb.setSyncStatus('synced', 'Sincronizado ✓');
        showToast('✓ Todos los movimientos eliminados');
      } catch(e) { window._fb.setSyncStatus('error', 'Error'); showToast('❌ Error al limpiar: ' + e.message); console.error('limpiarGestion error:', e); }
    }
  });
}

// ── NAVEGACIÓN TABS GESTIÓN (Finanzas / Órdenes / WindowsCenter / Clientes) ──
function switchGMain(tab) {
  try {
    const isFinanzas  = tab === 'finanzas';
    const isOrdenes   = tab === 'ordenes';
    const isClientes  = tab === 'clientes';
    const panels = [
      { id: 'gpanel-finanzas',      show: isFinanzas },
      { id: 'gpanel-ordenes',       show: isOrdenes },
      { id: 'gpanel-clientes',      show: isClientes }
    ];
    panels.forEach(p => {
      const el = document.getElementById(p.id);
      if (el) el.style.display = p.show ? 'block' : 'none';
    });
    const btnF = document.getElementById('gtab-main-finanzas');
    const btnO = document.getElementById('gtab-main-ordenes');
    const btnC = document.getElementById('gtab-main-clientes');
    if (btnF) { btnF.style.background  = isFinanzas  ? 'var(--ink)' : ''; btnF.style.color = isFinanzas  ? 'white' : ''; btnF.style.borderColor = isFinanzas  ? 'var(--ink)' : ''; }
    if (btnO) { btnO.style.background  = isOrdenes   ? 'var(--ink)' : ''; btnO.style.color = isOrdenes   ? 'white' : ''; btnO.style.borderColor = isOrdenes   ? 'var(--ink)' : ''; }
    if (btnC) { btnC.style.background  = isClientes  ? '#8250df'    : ''; btnC.style.color = isClientes  ? 'white' : ''; btnC.style.borderColor = isClientes  ? '#8250df'    : ''; }
    if (isOrdenes) renderOrdenesTrabajoLista();
    if (isClientes) renderClientes();
  } catch(err) {
    console.error('switchGMain error:', err);
  }
}

// ── GASTO RÁPIDO (FAB) ──
function abrirGastoRapido() {
  document.getElementById('qr-desc').value = '';
  document.getElementById('qr-monto').value = '';
  document.getElementById('qr-medio').value = 'efectivo';
  document.getElementById('qr-categoria').value = 'combustible';
  document.getElementById('qr-persona').value = 'windowscenter';
  document.getElementById('modal-gasto-rapido').classList.add('open');
  setTimeout(function() { var el = document.getElementById('qr-desc'); if (el) el.focus(); }, 100);
}

function cerrarGastoRapido() {
  document.getElementById('modal-gasto-rapido').classList.remove('open');
}

async function guardarGastoRapido() {
  var desc = document.getElementById('qr-desc').value.trim();
  var monto = parseFloat(document.getElementById('qr-monto').value);
  var medio = document.getElementById('qr-medio').value;
  var categoria = document.getElementById('qr-categoria').value;
  var persona = document.getElementById('qr-persona').value;
  if (!desc) { showToast('⚠️ Ingresá una descripción'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Ingresá un monto válido'); return; }
  try {
    window._fb.setSyncStatus('syncing', 'Guardando…');
    var _fb = window._fb;
    var hoy = new Date();
    var fechaSolo = hoy.toLocaleDateString('es-AR');
    var fechaStr = fechaSolo + ' ' + hoy.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    var id = crypto.randomUUID();
    await _fb.setDoc(_fb.doc(_fb.db, "movimientos", id), {
      id: id, fecha: fechaSolo, tipo: 'gasto', persona: persona,
      categoria: categoria, desc: desc, monto: monto, medio: medio,
      esAmbos: false, montoOriginal: monto
    });
    _fb.setSyncStatus('synced', 'Sincronizado ✓');
    cerrarGastoRapido();
    showToast('✓ Gasto registrado: −$' + monto.toLocaleString('es-AR'));
  } catch(e) {
    window._fb.setSyncStatus('error', 'Error');
    showToast('❌ Error al guardar');
    console.error('guardarGastoRapido:', e);
  }
}

window.abrirGastoRapido = abrirGastoRapido;
window.cerrarGastoRapido = cerrarGastoRapido;
window.guardarGastoRapido = guardarGastoRapido;