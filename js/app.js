// ══════════════════════════════════════════════
// APP — bootstrap e inicialización general
// ══════════════════════════════════════════════

// ── GUARDAR CONFIG EN FIRESTORE ──
async function guardarConfig() {
  try {
    const { setDoc, confDoc } = window._fb;
    await setDoc(confDoc, {
      empresa:     document.getElementById('empresa').value,
      empContacto: document.getElementById('empContacto').value,
      pAlu:        document.getElementById('pAlu').value,
      pVid:        document.getElementById('pVid').value,
      pMO:         document.getElementById('pMO').value,
      pGanancia:   document.getElementById('pGanancia').value,
      pIVA:        document.getElementById('pIVA').value,
      pDescuento:  document.getElementById('pDescuento').value,
      nroPresup:   document.getElementById('nroPresup').value,
      cliente:     document.getElementById('cliente').value,
      obra:        document.getElementById('obra').value,
      fecha:       document.getElementById('fecha').value,
    }, { merge: true });
  } catch(e) { console.warn('Error guardando config', e); }
}

// Auto-guardar config al cambiar campos
document.querySelectorAll('#empresa,#empContacto,#pAlu,#pVid,#pMO,#pGanancia,#pIVA,#pDescuento,#nroPresup,#cliente,#obra,#fecha').forEach(el => {
  el.addEventListener('change', guardarConfig);
});

// Fecha de hoy inicial
const hoy = new Date();
const elFechaInicial = document.getElementById('fecha');
if (elFechaInicial) elFechaInicial.value = hoy.toLocaleDateString('es-AR');
const elNroPresupInicial = document.getElementById('nroPresup');
if (elNroPresupInicial) elNroPresupInicial.value = `${hoy.getFullYear()}-${String(nroCounter).padStart(3,'0')}`;

// ── INICIALIZACIÓN DE VISTA ──
switchGTab('ingreso');
setPeriodo('mes');
initFechas();