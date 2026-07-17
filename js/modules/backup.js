// ══════════════════════════════════════════════
// BACKUP / EXPORT + IMPORT JSON
// ══════════════════════════════════════════════

async function exportarBackupJSON() {
  try {
    showToast('📦 Generando backup…');
    const { getDocs, collection, db } = window._fb;

    const [movSnap, otSnap, wcSnap, cliSnap] = await Promise.all([
      getDocs(collection(db, "movimientos")),
      getDocs(collection(db, "ordenesTrabajo")),
      getDocs(collection(db, "descuentosWC")),
      getDocs(collection(db, "clientes")),
    ]);

    const backup = {
      version: 1,
      fecha: new Date().toISOString(),
      movimientos: movSnap.docs.map(d => d.data()),
      ordenesTrabajo: otSnap.docs.map(d => d.data()),
      descuentosWC: wcSnap.docs.map(d => d.data()),
      clientes: cliSnap.docs.map(d => d.data()),
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✓ Backup descargado');
  } catch (e) {
    showToast('❌ Error al generar backup');
    console.error('exportarBackupJSON:', e);
  }
}

function triggerImportBackup() {
  document.getElementById('import-backup-input').click();
}

async function importarBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.version || !backup.movimientos) {
      showToast('⚠️ Archivo de backup inválido');
      return;
    }

    const totalItems = (backup.movimientos?.length || 0) + (backup.ordenesTrabajo?.length || 0) + (backup.descuentosWC?.length || 0) + (backup.clientes?.length || 0);
    mostrarConfirm({
      icon: '📦',
      title: '¿Importar backup?',
      msg: `Se importarán ${totalItems} registros (${backup.movimientos?.length || 0} mov, ${backup.ordenesTrabajo?.length || 0} OT, ${backup.descuentosWC?.length || 0} desc, ${backup.clientes?.length || 0} clientes). Se guardan SOLO los que no existen.`,
      btnLabel: 'Importar',
      btnClass: 'btn-primary',
      onOk: async () => {
        try {
          showToast('📦 Importando…');
          const { setDoc, doc, db, getDoc } = window._fb;

          let imported = 0;
          let skipped = 0;

          // Importar movimientos (skip existing)
          for (const m of (backup.movimientos || [])) {
            if (m.id) {
              const existing = await getDoc(doc(db, "movimientos", m.id));
              if (!existing.exists()) {
                await setDoc(doc(db, "movimientos", m.id), m);
                imported++;
              } else { skipped++; }
            }
          }

          // Importar OTs (skip existing)
          for (const o of (backup.ordenesTrabajo || [])) {
            if (o.id) {
              const existing = await getDoc(doc(db, "ordenesTrabajo", o.id));
              if (!existing.exists()) {
                await setDoc(doc(db, "ordenesTrabajo", o.id), o);
                imported++;
              } else { skipped++; }
            }
          }

          // Importar descuentos WC (skip existing)
          for (const d of (backup.descuentosWC || [])) {
            if (d.id) {
              const existing = await getDoc(doc(db, "descuentosWC", d.id));
              if (!existing.exists()) {
                await setDoc(doc(db, "descuentosWC", d.id), d);
                imported++;
              } else { skipped++; }
            }
          }

          // Importar clientes (skip existing)
          for (const c of (backup.clientes || [])) {
            if (c.id) {
              const existing = await getDoc(doc(db, "clientes", c.id));
              if (!existing.exists()) {
                await setDoc(doc(db, "clientes", c.id), c);
                imported++;
              } else { skipped++; }
            }
          }

          const skipMsg = skipped > 0 ? ` (${skipped} omitidos ya existentes)` : '';
          showToast(`✓ ${imported} registros importados` + skipMsg);
        } catch (err) {
          showToast('❌ Error al importar: ' + err.message);
          console.error('importarBackupJSON:', err);
        }
      }
    });
  } catch (err) {
    showToast('❌ Error al leer el archivo');
    console.error('importarBackupJSON:', err);
  }

  // Reset input para poder reimportar el mismo archivo
  e.target.value = '';
}
