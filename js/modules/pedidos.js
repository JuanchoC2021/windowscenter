// ══════════════════════════════════════════════
// PEDIDOS / PRESUPUESTO DE ABERTURAS (legacy)
// NOTA: esta sección está desactivada en la UI actual de WindowsCenter Pro
// (no hay vista de "pedido" ni sidebar en index.html). Se conserva el
// código por compatibilidad y por si se reactiva la función de
// presupuestos en el futuro.
// ══════════════════════════════════════════════

const { jsPDF } = window.jspdf;

// ── CONFIGURACIÓN POR LÍNEA ──
const CONFIG_LINEA = {
  modena:  { nombre: 'Módena',   angulo: '45°', tipo: 'Corrediza',   pesoML: 1.1,  rebaje: 1.5 },
  herrero: { nombre: 'Herrero',  angulo: '90°', tipo: 'Proyectante', pesoML: 0.85, rebaje: 2.0 },
  a30:     { nombre: 'A30 New',  angulo: '45°', tipo: 'Corrediza',   pesoML: 1.2,  rebaje: 1.5 },
  vitrum:  { nombre: 'Vitrum',   angulo: '45°', tipo: 'Fijo',        pesoML: 0.7,  rebaje: 1.2 }
};
const BADGE_COLOR = { modena: 'badge-blue', herrero: 'badge-amber', a30: 'badge-green', vitrum: 'badge-purple' };

// ── DESPIECE ──
function calcularDespiece(linea, W, H) {
  let piezas = [], metrosLineales = 0;
  if (linea === 'modena' || linea === 'a30') {
    const hojaH = H - 4.5, hojaW = (W / 2 + 1.5), travH = H - 6.0;
    piezas = [
      { grupo: 'Marco',      piezas: `2 × ${W}cm | 2 × ${H}cm`,         angulo: '45°' },
      { grupo: 'Hojas (×2)', piezas: `4 × ${hojaW}cm | 4 × ${hojaH}cm`, angulo: '45°' },
      { grupo: 'Travesaño',  piezas: `1 × ${travH}cm`,                   angulo: '90°' },
    ];
    metrosLineales = ((W * 2 + H * 2) + (hojaW * 4 + hojaH * 4) + travH) / 100;
  } else if (linea === 'herrero') {
    const dintel = W - 3.0, hojaH = H - 3.5, hojaW = (W / 2 - 2.0);
    piezas = [
      { grupo: 'Marco',      piezas: `2 × ${H}cm | 2 × ${dintel}cm`,     angulo: '90°' },
      { grupo: 'Hojas (×2)', piezas: `4 × ${hojaH}cm | 4 × ${hojaW}cm`, angulo: '90°' },
    ];
    metrosLineales = (H * 2 + dintel * 2 + hojaH * 4 + hojaW * 4) / 100;
  } else if (linea === 'vitrum') {
    piezas = [{ grupo: 'Marco fijo', piezas: `2 × ${W}cm | 2 × ${H}cm`, angulo: '45°' }];
    metrosLineales = (W * 2 + H * 2) / 100;
  }
  return { piezas, metrosLineales };
}

// ── COSTO ──
function calcularCosto(linea, W, H, vidMultiplier) {
  const cfg = CONFIG_LINEA[linea];
  const alu = parseFloat(document.getElementById('pAlu').value) || 12500;
  const vid = parseFloat(document.getElementById('pVid').value) || 18000;
  const mo  = parseFloat(document.getElementById('pMO').value)  || 4500;
  const gan = (parseFloat(document.getElementById('pGanancia').value) || 40) / 100;
  const iva = (parseFloat(document.getElementById('pIVA').value)      || 21) / 100;
  const { metrosLineales } = calcularDespiece(linea, W, H);
  const m2Vidrio = ((W - cfg.rebaje * 2) * (H - cfg.rebaje * 2)) / 10000;
  const costoAlu = metrosLineales * cfg.pesoML * alu;
  const costoVid = m2Vidrio * vid * vidMultiplier;
  const costoMO  = (W * H / 10000) * mo;
  const subtotal = (costoAlu + costoVid + costoMO) * (1 + gan);
  const total    = subtotal * (1 + iva);
  return {
    costoAlu: Math.round(costoAlu), costoVid: Math.round(costoVid),
    costoMO:  Math.round(costoMO),  subtotal: Math.round(subtotal),
    conIVA:   Math.round(total),    metrosLineales
  };
}

// ── AGREGAR ABERTURA (desactivado) ──
async function agregarObra() {
  showToast('⚠️ Presupuesto/aberturas desactivadas');
}

// ── BORRAR ABERTURA (con confirmación) ──
function confirmarBorrar(id) {
  const item = window.pedido.find(i => i.id === id);
  const nombre = item ? item.desc : 'esta abertura';
  mostrarConfirm({
    icon: '🗑️',
    title: '¿Eliminar abertura?',
    msg: `"${nombre}" se eliminará del pedido. Esta acción no se puede deshacer.`,
    btnLabel: 'Eliminar',
    btnClass: 'btn-outline',
    onOk: () => borrar(id)
  });
}

async function borrar(id) {
  try {
    window._fb.setSyncStatus('syncing', 'Guardando…');
    const { deleteDoc, doc, db } = window._fb;
    await deleteDoc(doc(db, "pedido", id.toString()));
    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
  } catch(e) { showToast('❌ Error al eliminar'); console.error(e); }
}

// ── LIMPIAR PEDIDO COMPLETO ──
function confirmarLimpiarPedido() {
  // Presupuesto/aberturas desactivado: se mantiene solo por compatibilidad.
  showToast('⚠️ La sección de presupuesto está desactivada');
}

async function limpiarPedido() {
  try {
    console.log('limpiarPedido: inicio');
    window._fb.setSyncStatus('syncing', 'Limpiando…');
    const { getDocs, doc, db, collection, writeBatch } = window._fb;
    console.log('limpiarPedido: obteniendo docs...');
    const snap = await getDocs(collection(db, "pedido"));
    console.log('limpiarPedido: docs encontrados:', snap.size);
    if (snap.empty) { showToast('⚠️ El pedido ya está vacío'); window._fb.setSyncStatus('synced', 'Sincronizado ✓'); return; }
    const chunks = [];
    let batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach(d => {
      console.log('limpiarPedido: marcando para borrar:', d.id);
      batch.delete(doc(db, "pedido", d.id));
      count++;
      if (count === 500) { chunks.push(batch); batch = writeBatch(db); count = 0; }
    });
    chunks.push(batch);
    for (const b of chunks) await b.commit();
    console.log('limpiarPedido: commit OK');
    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
    showToast('✓ Pedido limpiado');
    const nroEl = document.getElementById('nroPresup');
    const partes = (nroEl.value || '').split('-');
    if (partes.length === 2) {
      const num = parseInt(partes[1]) + 1;
      nroEl.value = `${partes[0]}-${String(num).padStart(3,'0')}`;
      guardarConfig();
    }
  } catch(e) { showToast('❌ Error: ' + e.message); console.error('limpiarPedido ERROR:', e); }
}

// ── EDITAR ABERTURA ──
function abrirEditar(id) {
  const item = window.pedido.find(i => i.id === id);
  if (!item) return;
  document.getElementById('edit-id').value          = item.id;
  document.getElementById('edit-descripcion').value = item.desc;
  document.getElementById('edit-linea').value       = item.linea;
  document.getElementById('edit-ancho').value       = item.W;
  document.getElementById('edit-alto').value        = item.H;
  document.getElementById('edit-cantidad').value    = item.cant;
  document.getElementById('edit-vidrio').value      = `${item.vidMult},${item.vidNombre}`;
  document.getElementById('modal-editar').classList.add('open');
}

function cerrarModalEditar() {
  document.getElementById('modal-editar').classList.remove('open');
}

async function guardarEdicion() {
  const id    = document.getElementById('edit-id').value;
  const linea = document.getElementById('edit-linea').value;
  const W     = parseFloat(document.getElementById('edit-ancho').value);
  const H     = parseFloat(document.getElementById('edit-alto').value);
  const cant  = parseInt(document.getElementById('edit-cantidad').value) || 1;
  const vidrioV   = document.getElementById('edit-vidrio').value.split(',');
  const desc      = document.getElementById('edit-descripcion').value.trim() || CONFIG_LINEA[linea].nombre;
  const dto       = (parseFloat(document.getElementById('pDescuento').value) || 0) / 100;
  if (!W || !H || W < 10 || H < 10) { showToast('⚠️ Medidas inválidas (mínimo 10cm)'); return; }
  const vidMult   = parseFloat(vidrioV[0]);
  const vidNombre = vidrioV[1];
  const costos    = calcularCosto(linea, W, H, vidMult);
  const { piezas, metrosLineales } = calcularDespiece(linea, W, H);
  const precioUnit = Math.round(costos.conIVA * (1 - dto));
  const itemOriginal = window.pedido.find(i => i.id === id);
  const itemActualizado = {
    ...itemOriginal,
    linea, desc, W, H, cant, vidNombre, vidMult,
    piezas, metrosLineales, costos, precioUnit,
    subtotalFinal: precioUnit * cant
  };
  try {
    window._fb.setSyncStatus('syncing', 'Guardando…');
    const { setDoc, doc, db } = window._fb;
    await setDoc(doc(db, "pedido", id), itemActualizado);
    window._fb.setSyncStatus('synced', 'Sincronizado ✓');
    cerrarModalEditar();
    showToast('✓ Abertura actualizada');
  } catch(e) { showToast('❌ Error al guardar'); console.error(e); }
}

// ── ENVIAR A GESTIÓN (desactivado) ──
function enviarAGestion() {
  // Presupuesto desactivado: no se carga venta desde aberturas.
  showToast('⚠️ Presupuesto desactivado');
}

// ── RENDER PRESUPUESTO (tabla de aberturas) ──
window.render = function() {
  const tbody = document.getElementById('tabla-body');
  if (!tbody) return; // la sección de Aberturas no está presente en este layout
  if (!window.pedido || window.pedido.length === 0) {
    tbody.innerHTML = `<tr id="empty-row"><td colspan="10"><div class="empty-state"><div class="empty-icon">🪟</div><h3>Sin aberturas cargadas</h3><p>Completá el formulario y hacé clic en "Añadir abertura" para comenzar.</p></div></td></tr>`;
    updateStats(); return;
  }
  let html = '';
  window.pedido.forEach((i, idx) => {
    const cfg = CONFIG_LINEA[i.linea];
    const cortesHTML = i.piezas.map(p =>
      `<span><span class="corte-label">${p.grupo}:</span> ${p.piezas} <span class="corte-label">(${p.angulo})</span></span>`
    ).join('');
    html += `
    <tr>
      <td style="color:var(--ink3);font-size:12px">${String(i.nro).padStart(2,'0')}</td>
      <td><div style="font-weight:600;font-size:13px">${i.desc}</div><div style="font-size:11px;color:var(--ink3);margin-top:2px">${cfg.tipo} · ${cfg.angulo}</div></td>
      <td><span class="badge ${BADGE_COLOR[i.linea]}">${cfg.nombre}</span></td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${i.W} × ${i.H} cm</td>
      <td style="font-weight:600;text-align:center">${i.cant}</td>
      <td><div class="cortes-box">${cortesHTML}</div></td>
      <td style="font-size:12px">${i.vidNombre}</td>
      <td><div class="price-cell">$${i.precioUnit.toLocaleString('es-AR')}</div><div class="price-sub">sin IVA: $${i.costos.subtotal.toLocaleString('es-AR')}</div></td>
      <td><div class="price-cell" style="color:var(--blue)">$${i.subtotalFinal.toLocaleString('es-AR')}</div><div class="price-sub">${i.cant > 1 ? `${i.cant} × $${i.precioUnit.toLocaleString('es-AR')}` : ''}</div></td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="abrirEditar('${i.id}')" title="Editar" style="color:var(--blue);margin-right:4px"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286Z"/></svg></button>
        <button class="action-btn" onclick="confirmarBorrar('${i.id}')" title="Eliminar"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg></button>
      </td>
    </tr>`;
  });
  const totalSinIVA = window.pedido.reduce((s,i) => s + i.costos.subtotal * i.cant, 0);
  const totalConIVA = window.pedido.reduce((s,i) => s + i.subtotalFinal, 0);
  const iva = totalConIVA - totalSinIVA;
  html += `<tr class="total-row"><td colspan="7" style="text-align:right"><div style="font-size:12px;color:#8b949e">Subtotal sin IVA: $${Math.round(totalSinIVA).toLocaleString('es-AR')} &nbsp;·&nbsp; IVA: $${Math.round(iva).toLocaleString('es-AR')}</div></td><td><div class="total-label">TOTAL</div><div class="total-val">$${Math.round(totalConIVA).toLocaleString('es-AR')}</div></td><td colspan="2"></td></tr>`;
  tbody.innerHTML = html;
  updateStats();
};

function updateStats() {
  const alu   = (window.pedido || []).reduce((s,i) => s + i.metrosLineales * i.cant, 0);
  const total = (window.pedido || []).reduce((s,i) => s + i.subtotalFinal, 0);
  document.getElementById('stat-items').textContent = (window.pedido || []).length;
  document.getElementById('stat-alu').textContent   = `${alu.toFixed(1)} m`;
  document.getElementById('stat-total').textContent = `$${Math.round(total).toLocaleString('es-AR')}`;
}

// ── NAVEGACIÓN DE VISTA (compatibilidad, hoy solo existe Gestión) ──
function switchView(view) {
  // Ya no existe vista de presupuesto.
  // Mantenemos la función para compatibilidad, pero siempre mostramos Gestión.
  document.getElementById('view-gestion').style.display = 'flex';
  if (document.getElementById('view-presup')) {
    document.getElementById('view-presup').style.display = 'none';
  }
  if (document.getElementById('nav-gestion')) {
    document.getElementById('nav-gestion').style.background  = 'var(--ink)';
    document.getElementById('nav-gestion').style.color       = 'white';
    document.getElementById('nav-gestion').style.borderColor = 'var(--ink)';
  }
}