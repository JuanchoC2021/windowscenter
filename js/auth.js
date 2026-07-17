// ══════════════════════════════════════════════
// AUTH — login (teléfono + PIN casillas), logout y estado
// ══════════════════════════════════════════════

const loginScreen  = document.getElementById('login-screen');
const appContent   = document.getElementById('app-content');
const loginForm    = document.getElementById('login-form');
const loginError   = document.getElementById('login-error');
const userEmail    = document.getElementById('user-email');
const pinHidden    = document.getElementById('login-pin');
const pinBoxes     = document.querySelectorAll('.pin-box');

// ── PIN CASILLAS: auto-advance, backspace, paste ──
function getPinValue() {
  return Array.from(pinBoxes).map(b => b.value).join('');
}

function updatePinHidden() {
  pinHidden.value = getPinValue();
  // Actualizar estilo de casillas llenas
  pinBoxes.forEach(b => {
    b.classList.toggle('filled', b.value.length === 1);
    b.classList.remove('error');
  });
}

function focusPinBox(index) {
  if (index >= 0 && index < pinBoxes.length) {
    pinBoxes[index].focus();
  }
}

pinBoxes.forEach((box, i) => {
  // Solo permitir números
  box.addEventListener('input', (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = val;

    if (val && i < pinBoxes.length - 1) {
      focusPinBox(i + 1);
    }
    updatePinHidden();

    // Auto-submit cuando están todos llenos
    if (getPinValue().length === 6) {
      loginForm.dispatchEvent(new Event('submit'));
    }
  });

  // Backspace: retroceder y borrar
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      if (!box.value && i > 0) {
        pinBoxes[i - 1].value = '';
        focusPinBox(i - 1);
        updatePinHidden();
      }
    }
    // Flechas izquierda/derecha
    if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      focusPinBox(i - 1);
    }
    if (e.key === 'ArrowRight' && i < pinBoxes.length - 1) {
      e.preventDefault();
      focusPinBox(i + 1);
    }
  });

  // Seleccionar todo al hacer click
  box.addEventListener('focus', () => box.select());

  // Pegar desde clipboard
  box.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, 6);

    if (pasted) {
      pasted.split('').forEach((digit, j) => {
        if (pinBoxes[j]) pinBoxes[j].value = digit;
      });
      updatePinHidden();
      // Focus en la siguiente vacía o la última
      const nextEmpty = pasted.length < 6 ? pasted.length : 5;
      focusPinBox(nextEmpty);
      // Auto-submit si están todos llenos
      if (pasted.length === 6) {
        loginForm.dispatchEvent(new Event('submit'));
      }
    }
  });
});

// ── LOGIN ──
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const phone = document.getElementById('login-phone').value.trim().replace(/\D/g, '');
  const pin   = getPinValue();

  if (!phone) { loginError.textContent = 'Ingresá tu número de teléfono'; return; }
  if (pin.length !== 6) { loginError.textContent = 'El PIN debe tener 6 dígitos'; return; }

  const fakeEmail = `wc_${phone}@workshop.local`;

  const btn = loginForm.querySelector('.login-btn');
  btn.disabled = true;
  btn.classList.add('loading');

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
    // Animar error en casillas
    pinBoxes.forEach(b => { b.classList.add('error'); b.value = ''; });
    updatePinHidden();
    focusPinBox(0);
    btn.disabled = false;
    btn.classList.remove('loading');
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
    loginScreen.style.display = 'none';
    appContent.style.display  = 'flex';
    const phone = user.email?.replace('wc_', '').replace('@workshop.local', '') || user.email;
    userEmail.textContent = phone;
    window._fb.startDataListeners();
    // Reset login form
    const btn = loginForm.querySelector('.login-btn');
    btn.disabled = false;
    btn.classList.remove('loading');
    loginForm.reset();
    pinBoxes.forEach(b => { b.value = ''; b.classList.remove('filled', 'error'); });
    updatePinHidden();
  } else {
    loginScreen.style.display = 'flex';
    appContent.style.display  = 'none';
    focusPinBox(0);
  }
});
