// ══════════════════════════════════════════════
// HELPERS — toast, modales y confirm dialog genéricos
// ══════════════════════════════════════════════

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── MODAL EMPRESA ──
function cerrarModal() { document.getElementById('modal-empresa').classList.remove('open'); }

function guardarEmpresa() {
  document.getElementById('empresa').value     = document.getElementById('m-empresa').value;
  document.getElementById('empContacto').value = document.getElementById('m-contacto').value;
  cerrarModal();
  guardarConfig();
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