// ══════════════════════════════════════════════
// FIREBASE SDK (módulos ES) — Firestore + Auth
// ══════════════════════════════════════════════
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, collection,
         setDoc, deleteDoc, onSnapshot,
         writeBatch, getDocs }                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword,
         signOut, onAuthStateChanged }            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);

const movCol = collection(db, "movimientos");
const otCol  = collection(db, "ordenesTrabajo");
const wcdCol = collection(db, "descuentosWC");

function setSyncStatus(state, text) {
  const el   = document.getElementById('sync-indicator');
  if (!el) return;
  const dot  = el.querySelector('.sync-dot');
  const span = document.getElementById('sync-text');
  el.className = '';
  el.classList.add(state);
  dot.classList.toggle('pulse', state === 'syncing');
  span.textContent = text;
}

// ── EXPONER API GLOBAL ──
window._fb = {
  db, doc, collection, setDoc, deleteDoc, writeBatch, getDocs,
  auth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  movCol, otCol, wcdCol,
  setSyncStatus,
  _listenersStarted: false
};

// ── INICIALIZAR LISTENERS DE DATOS (solo después de auth) ──
function startDataListeners() {
  if (window._fb._listenersStarted) return;
  window._fb._listenersStarted = true;

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
}

// Exponer para que auth.js llame cuando el usuario se autentique
window._fb.startDataListeners = startDataListeners;
