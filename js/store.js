// ══════════════════════════════════════════════
// STORE — estado global de la app
// Los arrays se llenan en tiempo real desde services/firebase.js
// (listeners de Firestore) y se leen desde los módulos de UI/lógica.
// ══════════════════════════════════════════════

window.pedido            = [];
window.movimientos       = [];
window.ordenesTrabajoData = [];
window.descuentosWC      = [];

// Contador local de número de presupuesto (módulo de pedidos, legacy)
let nroCounter = 1;

// ── SALDO FAVOR/DEBE DE UNA PERSONA (Adrian / Enzo) ──
// saldo = (gasto-costo) - (retiro-caja)
// + significa que WindowsCenter le debe (a favor de la persona)
// - significa que la persona retiró más de lo que tiene a favor (debe)
function getSaldoPersonaFavorDebe(persona, movimientos) {
  const montoGlobal = m => (m.esAmbos ? (m.montoOriginal || 0) : (m.monto || 0));
  const favorCostos = (movimientos || [])
    .filter(m => m.persona === persona && m.tipo === 'gasto' && m.categoria === 'gasto-costo')
    .reduce((s, m) => s + montoGlobal(m), 0);
  const retiroCaja = (movimientos || [])
    .filter(m => m.persona === persona && m.tipo === 'gasto' && m.categoria === 'retiro-caja')
    .reduce((s, m) => s + montoGlobal(m), 0);
  return favorCostos - retiroCaja;
}