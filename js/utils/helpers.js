// ══════════════════════════════════════════════
// HELPERS — toast y confirm dialog genéricos
// ══════════════════════════════════════════════

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── CONFIRM DIALOG (genérico, usado por todos los módulos) ──
let _confirmCallback = null;

function mostrarConfirm({ icon='⚠️', title, msg, btnLabel='Confirmar', btnClass='btn-primary', onOk }) {
  document.getElementById('confirm-icon').textContent  = icon;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  const btn = document.getElementById('confirm-ok-btn');
  btn.textContent = btnLabel;
  btn.className   = `btn ${btnClass}`;
  _confirmCallback = onOk;
  document.getElementById('confirm-dialog').classList.add('open');
}

function cerrarConfirm() {
  document.getElementById('confirm-dialog').classList.remove('open');
  _confirmCallback = null;
}

function ejecutarConfirm() {
  const cb = _confirmCallback;
  cerrarConfirm();
  if (cb) {
    try {
      const result = cb();
      if (result && typeof result.catch === 'function') {
        result.catch(e => { showToast('❌ Error: ' + e.message); console.error('confirm error:', e); });
      }
    } catch(e) {
      showToast('❌ Error: ' + e.message);
      console.error('ejecutarConfirm error:', e);
    }
  }
}

// ── DARK MODE ──
const DARK_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"/></svg>';
const LIGHT_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-1.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM9.657 14.657a.75.75 0 0 1 0-1.06l1.06-1.061a.75.75 0 1 1 1.06 1.06l-1.06 1.061a.75.75 0 0 1-1.06 0ZM3.146 5.354a.75.75 0 0 1 0 1.06L2.086 6.475a.75.75 0 0 1-1.06-1.061l1.06-1.06a.75.75 0 0 1 1.06 0Zm8.293 8.293a.75.75 0 0 1-1.06 0l-1.061-1.06a.75.75 0 0 1 1.06-1.061l1.06 1.06a.75.75 0 0 1 0 1.06ZM2 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 2 8Zm12 0a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 14 8ZM7.5 14v.5a.75.75 0 0 1-1.5 0v-.5a.75.75 0 0 1 1.5 0ZM4 2.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 4 2.5ZM7.5 2v.5a.75.75 0 0 1-1.5 0V2a.75.75 0 0 1 1.5 0Z"/></svg>';

function applyDarkMode(on) {
  const link = document.getElementById('dark-css');
  if (link) link.disabled = !on;
  document.documentElement.classList.toggle('dark', on);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = on ? DARK_SVG : LIGHT_SVG;
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next = !isDark;
  applyDarkMode(next);
  localStorage.setItem('wc-theme', next ? 'dark' : 'light');
}

// Apply saved theme immediately
(function() {
  const saved = localStorage.getItem('wc-theme');
  if (saved === 'dark') {
    applyDarkMode(true);
  }
})();

// ── LOGO ──
function _isValidLogoDataUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 1024 * 1024) return false; // max 1MB
  return /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,/.test(url);
}

function aplicarLogo(dataUrl) {
  if (!_isValidLogoDataUrl(dataUrl)) {
    console.warn('Logo inválido, ignorando');
    return;
  }
  // App header
  const appLogo = document.getElementById('app-logo');
  const appLogoImg = document.getElementById('app-logo-img');
  if (appLogo) appLogo.style.display = 'flex';
  if (appLogoImg) { appLogoImg.src = dataUrl; appLogoImg.style.display = 'block'; }
  // Settings preview
  const settImg = document.getElementById('settings-logo-img');
  const settTxt = document.getElementById('settings-logo-text');
  const settPrev = document.getElementById('settings-logo-preview');
  if (settImg) { settImg.src = dataUrl; settImg.style.display = 'block'; }
  if (settTxt) settTxt.style.display = 'none';
  if (settPrev) settPrev.style.background = 'none';
}

function quitarLogo() {
  localStorage.removeItem('wc-logo');
  const appLogo = document.getElementById('app-logo');
  if (appLogo) appLogo.style.display = 'none';
  const settImg = document.getElementById('settings-logo-img');
  const settTxt = document.getElementById('settings-logo-text');
  const settPrev = document.getElementById('settings-logo-preview');
  if (settImg) { settImg.src = ''; settImg.style.display = 'none'; }
  if (settTxt) settTxt.style.display = '';
  if (settPrev) settPrev.style.background = 'linear-gradient(135deg,#0969da,#0550ae)';
  showToast('🗑️ Logo eliminado');
}

function inicializarLogo() {
  const savedLogo = localStorage.getItem('wc-logo');
  if (savedLogo) aplicarLogo(savedLogo);
}

document.addEventListener('DOMContentLoaded', inicializarLogo);

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) { showToast('⚠️ Máximo 500KB'); return; }
  if (!file.type.startsWith('image/')) { showToast('⚠️ Solo se permiten imágenes'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    if (!_isValidLogoDataUrl(dataUrl)) { showToast('⚠️ Formato de imagen inválido'); return; }
    localStorage.setItem('wc-logo', dataUrl);
    aplicarLogo(dataUrl);
    showToast('✓ Logo actualizado');
  };
  reader.readAsDataURL(file);
}

function abrirSettings() {
  document.getElementById('modal-settings').classList.add('open');
}

function cerrarSettings() {
  document.getElementById('modal-settings').classList.remove('open');
}
