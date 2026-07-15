// ══════════════════════════════════════════════
// FIREBASE SDK (módulos ES)
// ══════════════════════════════════════════════
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, collection,
         setDoc, deleteDoc, onSnapshot,
         writeBatch, getDocs }                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBzrb1SliWGEZwJ2vrYdkVdbDeAskIaJJE",
  authDomain:        "windowscenter-pro.firebaseapp.com",
  projectId:         "windowscenter-pro",
  storageBucket:     "windowscenter-pro.firebasestorage.app",
  messagingSenderId: "605631350391",
  appId:             "1:605631350391:web:542f95a31ce3e64e8aa872"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const movCol = collection(db, "movimientos");
const otCol  = collection(db, "ordenesTrabajo");
const wcdCol = collection(db, "descuentosWC");

function setSyncStatus(state, text) {
  const el   = document.getElementById('sync-indicator');
  const dot  = el.querySelector('.sync-dot');
  const span = document.getElementById('sync-text');
  el.className = '';
  el.classList.add(state);
  dot.classList.toggle('pulse', state === 'syncing');
  span.textContent = text;
}

window._fb = {
  db, doc, collection, setDoc, deleteDoc, writeBatch, getDocs,
  movCol, otCol, wcdCol,
  setSyncStatus
};

document.addEventListener('DOMContentLoaded', () => {

  onSnapshot(movCol, snap => {
    window.movimientos = [];
    snap.forEach(d => window.movimientos.push(d.data()));
    if (typeof window.renderGestion === 'function') window.renderGestion();
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  onSnapshot(otCol, snap => {
    window.ordenesTrabajoData = [];
    snap.forEach(d => window.ordenesTrabajoData.push(d.data()));
    window.ordenesTrabajoData.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    if (typeof window.renderGestion === 'function') window.renderGestion();
    if (typeof window.renderOrdenesTrabajoLista === 'function') window.renderOrdenesTrabajoLista();
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  onSnapshot(wcdCol, snap => {
    window.descuentosWC = [];
    snap.forEach(d => window.descuentosWC.push(d.data()));
    window.descuentosWC.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    if (typeof window.renderGestion === 'function') window.renderGestion();
    if (typeof window.renderDescuentosWC === 'function') window.renderDescuentosWC();
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  setSyncStatus('synced', 'Sincronizado ✓');
});
