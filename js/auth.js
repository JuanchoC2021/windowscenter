// ══════════════════════════════════════════════
// AUTH — login (teléfono + PIN), logout y estado de sesión
// ══════════════════════════════════════════════

const loginScreen  = document.getElementById('login-screen');
const appContent   = document.getElementById('app-content');
const loginForm    = document.getElementById('login-form');
const loginError   = document.getElementById('login-error');
const userEmail    = document.getElementById('user-email');

// ── LOGIN (teléfono + PIN → email fake en Firebase Auth) ──
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const phone = document.getElementById('login-phone').value.trim().replace(/\D/g, '');
  const pin   = document.getElementById('login-pin').value.trim();

  if (!phone) { loginError.textContent = 'Ingresá tu número de teléfono'; return; }
  if (!pin || pin.length !== 6) { loginError.textContent = 'El PIN debe tener 6 dígitos'; return; }

  // Formatear como email fake para Firebase Auth
  const fakeEmail = `wc_${phone}@workshop.local`;

  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';

  try {
    const { auth, signInWithEmailAndPassword } = window._fb;
    await signInWithEmailAndPassword(auth, fakeEmail, pin);
  } catch (err) {
    const msgs = {
      'auth/invalid-credential': 'Teléfono o PIN incorrectos',
      'auth/user-not-found':     'Teléfono o PIN incorrectos',
      'auth/wrong-password':     'Teléfono o PIN incorrectos',
      'auth/too-many-requests':  'Demasiados intentos. Esperá un minuto',
      'auth/network-request-failed': 'Error de red. Checkeá tu conexión',
    };
    loginError.textContent = msgs[err.code] || 'Error al ingresar';
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
});

// ── SIGN OUT ──
function cerrarSesion() {
  const { auth, signOut } = window._fb;
  signOut(auth);
}
window.cerrarSesion = cerrarSesion;

// ── AUTH STATE LISTENER ──
window._fb.onAuthStateChanged(window._fb.auth, (user) => {
  if (user) {
    // Autenticado → mostrar app
    loginScreen.style.display = 'none';
    appContent.style.display  = 'flex';

    // Mostrar teléfono del usuario (extraer del email fake)
    const phone = user.email?.replace('wc_', '').replace('@workshop.local', '') || user.email;
    userEmail.textContent = phone;

    // Arrancar listeners de datos (solo una vez)
    window._fb.startDataListeners();

    // Resetear botón de login por si quedó en estado "Ingresando…"
    const btn = loginForm.querySelector('button');
    btn.disabled = false;
    btn.textContent = 'Ingresar';
    loginForm.reset();
  } else {
    // No autenticado → mostrar login
    loginScreen.style.display = 'flex';
    appContent.style.display  = 'none';
  }
});
