// ══════════════════════════════════════════════
// AUTH — login, logout y estado de sesión
// ══════════════════════════════════════════════

const loginScreen  = document.getElementById('login-screen');
const appContent   = document.getElementById('app-content');
const loginForm    = document.getElementById('login-form');
const loginError   = document.getElementById('login-error');
const userEmail    = document.getElementById('user-email');

// ── LOGIN ──
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;

  if (!email || !pass) {
    loginError.textContent = 'Completá email y contraseña';
    return;
  }

  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';

  try {
    const { auth, signInWithEmailAndPassword } = window._fb;
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    const msgs = {
      'auth/invalid-credential': 'Email o contraseña incorrectos',
      'auth/user-not-found':     'Email o contraseña incorrectos',
      'auth/wrong-password':     'Email o contraseña incorrectos',
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
    userEmail.textContent = user.email;

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
