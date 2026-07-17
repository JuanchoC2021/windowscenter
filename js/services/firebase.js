// ══════════════════════════════════════════════
// FIREBASE SDK (módulos ES) — Firestore + Auth
// ══════════════════════════════════════════════
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, collection,
         setDoc, deleteDoc, onSnapshot,
         writeBatch, getDocs, getDoc,
         query, orderBy, limit as fsLimit,
         startAfter }                             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
const cliCol = collection(db, "clientes");

let _syncTimer = null;
function setSyncStatus(state, text) {
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  const dot  = el.querySelector('.sync-dot');
  const span = document.getElementById('sync-text');
  el.className = state;
  el.classList.add('visible');
  dot.classList.toggle('pulse', state === 'syncing');
  span.textContent = text;
  clearTimeout(_syncTimer);
  if (state !== 'syncing' && state !== 'error') {
    _syncTimer = setTimeout(() => el.classList.remove('visible'), 2000);
  }
}

// ── EXPONER API GLOBAL ──
window._fb = {
  db, doc, collection, setDoc, deleteDoc, writeBatch, getDocs, getDoc,
  query, orderBy, limit: fsLimit, startAfter,
  auth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  movCol, otCol, wcdCol, cliCol,
  setSyncStatus,
  _listenersStarted: false,

  // ── PAGINACIÓN (client-side) ──
  _movPageSize: 100,
  _movLastDoc: null,
  _movHasMore: true,
  _otPageSize: 100,
  _otLastDoc: null,
  _otHasMore: true
};

// ── INICIALIZAR LISTENERS DE DATOS (solo después de auth) ──
let _renderDebounceTimer = null;
let _pendingPanels = new Set();

function scheduleRender(panel) {
  _pendingPanels.add(panel);
  clearTimeout(_renderDebounceTimer);
  _renderDebounceTimer = setTimeout(() => {
    const panels = new Set(_pendingPanels);
    _pendingPanels.clear();
    if (panels.has('gestion') && typeof window.renderGestion === 'function') window.renderGestion();
    if (panels.has('ordenes') && typeof window.renderOrdenesTrabajoLista === 'function') window.renderOrdenesTrabajoLista();
    if (panels.has('clientes') && typeof window.renderClientes === 'function') window.renderClientes();
    if (panels.has('wc') && typeof window.renderDescuentosWC === 'function') window.renderDescuentosWC();
  }, 150);
}

function startDataListeners() {
  if (window._fb._listenersStarted) return;
  window._fb._listenersStarted = true;

  onSnapshot(movCol, snap => {
    window.movimientos = [];
    snap.forEach(d => window.movimientos.push(d.data()));
    scheduleRender('gestion');
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  onSnapshot(otCol, snap => {
    window.ordenesTrabajoData = [];
    snap.forEach(d => window.ordenesTrabajoData.push(d.data()));
    window.ordenesTrabajoData.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    scheduleRender('gestion');
    scheduleRender('ordenes');
    scheduleRender('clientes');
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  onSnapshot(wcdCol, snap => {
    window.descuentosWC = [];
    snap.forEach(d => window.descuentosWC.push(d.data()));
    window.descuentosWC.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    scheduleRender('gestion');
    scheduleRender('wc');
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  onSnapshot(cliCol, snap => {
    window.clientesData = [];
    snap.forEach(d => window.clientesData.push(d.data()));
    scheduleRender('clientes');
  }, err => { setSyncStatus('error', 'Error de conexión'); console.error(err); });

  setSyncStatus('synced', 'Sincronizado ✓');
}

// ── PAGINACIÓN: Cargar más movimientos ──
async function loadMoreMovimientos() {
  const fb = window._fb;
  if (!fb._movHasMore) return;
  try {
    setSyncStatus('syncing', 'Cargando más…');
    const lastVisible = fb._movLastDoc;
    let q;
    if (lastVisible) {
      q = query(fb.movCol, orderBy('id', 'desc'), startAfter(lastVisible), limit(fb._movPageSize));
    } else {
      q = query(fb.movCol, orderBy('id', 'desc'), limit(fb._movPageSize));
    }
    const snap = await getDocs(q);
    if (snap.docs.length < fb._movPageSize) fb._movHasMore = false;
    if (snap.docs.length > 0) fb._movLastDoc = snap.docs[snap.docs.length - 1];
    setSyncStatus('synced', 'Sincronizado ✓');
    return snap.docs.length;
  } catch(e) {
    setSyncStatus('error', 'Error al cargar');
    console.error('loadMoreMovimientos:', e);
    return 0;
  }
}

// ── PAGINACIÓN: Cargar más OTs ──
async function loadMoreOTs() {
  const fb = window._fb;
  if (!fb._otHasMore) return;
  try {
    setSyncStatus('syncing', 'Cargando más…');
    const lastVisible = fb._otLastDoc;
    let q;
    if (lastVisible) {
      q = query(fb.otCol, orderBy('id', 'desc'), startAfter(lastVisible), limit(fb._otPageSize));
    } else {
      q = query(fb.otCol, orderBy('id', 'desc'), limit(fb._otPageSize));
    }
    const snap = await getDocs(q);
    if (snap.docs.length < fb._otPageSize) fb._otHasMore = false;
    if (snap.docs.length > 0) fb._otLastDoc = snap.docs[snap.docs.length - 1];
    setSyncStatus('synced', 'Sincronizado ✓');
    return snap.docs.length;
  } catch(e) {
    setSyncStatus('error', 'Error al cargar');
    console.error('loadMoreOTs:', e);
    return 0;
  }
}

// Exponer para que auth.js llame cuando el usuario se autentique
window._fb.startDataListeners = startDataListeners;
window._fb.loadMoreMovimientos = loadMoreMovimientos;
window._fb.loadMoreOTs = loadMoreOTs;

// ── OFFLINE / ONLINE DETECTION ──
window._fb.isOnline = navigator.onLine;

function updateOnlineStatus() {
  const wasOnline = window._fb.isOnline;
  window._fb.isOnline = navigator.onLine;
  if (navigator.onLine) {
    setSyncStatus('synced', 'Conectado ✓');
    if (!wasOnline) showToast('✓ Conexión restaurada');
  } else {
    setSyncStatus('error', 'Sin conexión — modo offline');
    showToast('⚠️ Sin conexión — los cambios se guardarán cuando vuelva internet');
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
