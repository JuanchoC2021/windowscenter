// ══════════════════════════════════════════════
// ATAJOS DE TECLADO
// ══════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key === 'n') {
    e.preventDefault();
    if (typeof switchGMain === 'function') switchGMain('ordenes');
    setTimeout(() => {
      const el = document.getElementById('ot-cliente');
      if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 100);
  }

  if (ctrl && e.key === 'f') {
    e.preventDefault();
    if (typeof switchGMain === 'function') switchGMain('finanzas');
    setTimeout(() => {
      const hist = document.getElementById('g-historial-body');
      if (hist) hist.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  if (ctrl && e.key === 'e') {
    e.preventDefault();
    if (typeof exportarExcel === 'function') exportarExcel();
  }

  if (ctrl && e.key === 'b') {
    e.preventDefault();
    if (typeof exportarBackupJSON === 'function') exportarBackupJSON();
  }

  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }
});
