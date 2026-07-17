// ══════════════════════════════════════════════
// EXCEL — exportar historial de movimientos
// ══════════════════════════════════════════════

function exportarExcel() {
  const movimientos = window.movimientos || [];
  if (movimientos.length === 0) { showToast('⚠️ No hay movimientos para exportar'); return; }

  const filtroPersona = document.getElementById('g-filtro-persona') ? document.getElementById('g-filtro-persona').value : 'todos';
  const filtroTipo    = document.getElementById('g-filtro-tipo')    ? document.getElementById('g-filtro-tipo').value    : 'todos';

  let datos = movimientos.slice();
  datos = filtrarPorPeriodo(datos);
  if (filtroPersona !== 'todos') datos = datos.filter(m => m.persona === filtroPersona);
  if (filtroTipo    !== 'todos') datos = datos.filter(m => m.tipo    === filtroTipo);
  // Excluir duplicados "ambos secundarios" si se ve todos
  if (filtroPersona === 'todos') datos = datos.filter(m => !m.esAmbos || m.montoOriginal > 0);
  datos = datos.slice().reverse();

  if (datos.length === 0) { showToast('⚠️ No hay datos con el filtro actual'); return; }

  const empresa = 'WindowsCenter';

  // Hoja principal — historial
  const filas = datos.map(m => {
    const esIngreso = m.tipo === 'ingreso';
    const catLabel  = esIngreso ? (CATEGORIAS_INGRESO[m.categoria] || m.categoria) : (CATEGORIAS_GASTO[m.categoria] || m.categoria);
    const persona   = labelPersonaGestion(m.persona, m.esAmbos, false);
    const monto     = m.esAmbos ? (m.montoOriginal || 0) : m.monto;
    return {
      'Fecha':       m.fecha,
      'Tipo':        esIngreso ? 'Ingreso' : 'Gasto',
      'Destino':     persona,
      'Categoría':   catLabel,
      'Descripción': m.desc,
      'Monto':       monto,
      'Signo':       esIngreso ? monto : -monto
    };
  });

  // Hoja resumen
  const totalIng = datos.filter(m => m.tipo === 'ingreso').reduce((s,m) => s + (m.esAmbos ? (m.montoOriginal||0) : m.monto), 0);
  const totalGas = datos.filter(m => m.tipo === 'gasto').reduce((s,m)   => s + (m.esAmbos ? (m.montoOriginal||0) : m.monto), 0);
  const resumen  = [
    { 'Concepto': 'Total Ingresos', 'Monto': totalIng },
    { 'Concepto': 'Total Gastos',   'Monto': totalGas },
    { 'Concepto': 'Saldo neto',     'Monto': totalIng - totalGas },
    { 'Concepto': 'Margen %',       'Monto': totalIng > 0 ? +(((totalIng - totalGas) / totalIng * 100).toFixed(1)) : 0 },
  ];

  const wb  = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(filas);
  const ws2 = XLSX.utils.json_to_sheet(resumen);

  // Ancho de columnas historial
  ws1['!cols'] = [
    {wch:20},{wch:10},{wch:14},{wch:18},{wch:40},{wch:14},{wch:14}
  ];
  ws2['!cols'] = [{wch:20},{wch:14}];

  XLSX.utils.book_append_sheet(wb, ws1, 'Historial');
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

  // Nombre del archivo con período
  const periodoLabel = { hoy: 'Hoy', semana: 'Semana', mes: 'Mes', todo: 'Completo', custom: 'Personalizado' };
  const nombreArchivo = `Gestion_${empresa.replace(/\s+/g,'_')}_${periodoLabel[gPeriodoActivo] || ''}_${new Date().toLocaleDateString('es-AR').replace(/\//g,'-')}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
  showToast(`✓ Excel exportado (${datos.length} movimientos)`);
}   