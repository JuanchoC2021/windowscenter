// ══════════════════════════════════════════════
// PDF — presupuesto cliente y hoja de taller
// NOTA: la sección de presupuesto/aberturas está desactivada en la UI
// actual (ver modules/pedidos.js). Este código se conserva por si se
// reactiva esa vista más adelante.
// ══════════════════════════════════════════════

// ── PDF CLIENTE ──
function pdfCliente(doc) {
  const empresa  = document.getElementById('empresa').value     || 'Mi Empresa';
  const contacto = document.getElementById('empContacto').value || '';
  const cliente  = document.getElementById('cliente').value     || '—';
  const obra     = document.getElementById('obra').value        || '—';
  const nro      = document.getElementById('nroPresup').value   || '001';
  const fecha    = document.getElementById('fecha').value       || '';
  const dto      = (parseFloat(document.getElementById('pDescuento').value) || 0) / 100;

  doc.setFillColor(13,17,23); doc.rect(0,0,210,38,'F');
  doc.setFillColor(9,105,218); doc.rect(0,0,6,38,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont(undefined,'bold');
  doc.text(empresa,14,16);
  doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(140,150,165);
  doc.text(contacto,14,24); doc.text('PRESUPUESTO',14,32);
  doc.setTextColor(255,255,255); doc.setFontSize(10); doc.setFont(undefined,'bold');
  doc.text(`N° ${nro}`,195,16,{align:'right'});
  doc.setFont(undefined,'normal'); doc.setFontSize(9); doc.setTextColor(140,150,165);
  doc.text(fecha,195,24,{align:'right'});
  doc.setTextColor(30,40,55); doc.setFontSize(9); doc.setFont(undefined,'bold');
  doc.text('CLIENTE',14,48); doc.text('OBRA / DIRECCIÓN',110,48);
  doc.setFont(undefined,'normal'); doc.setFontSize(11); doc.setTextColor(13,17,23);
  doc.text(cliente,14,56); doc.setFontSize(10); doc.text(obra,110,56);
  doc.setDrawColor(220,222,226); doc.line(14,61,196,61);

  const rows = window.pedido.map((i,idx) => [
    String(idx+1),
    `${i.desc}\n${CONFIG_LINEA[i.linea].nombre} ${CONFIG_LINEA[i.linea].tipo}`,
    `${i.W} × ${i.H} cm`, i.vidNombre, String(i.cant),
    `$${i.precioUnit.toLocaleString('es-AR')}`,
    `$${i.subtotalFinal.toLocaleString('es-AR')}`
  ]);
  doc.autoTable({
    startY:65, head:[['#','Descripción','Medidas','Vidrio','Cant.','P. Unit.','Subtotal']], body:rows,
    theme:'plain', styles:{font:'helvetica',fontSize:9,cellPadding:4},
    headStyles:{fillColor:[246,248,250],textColor:[100,116,139],fontStyle:'bold',fontSize:8},
    columnStyles:{0:{cellWidth:10},2:{cellWidth:30},4:{cellWidth:12,halign:'center'},5:{halign:'right',cellWidth:30},6:{halign:'right',cellWidth:30}},
    alternateRowStyles:{fillColor:[252,253,254]}
  });
  const y = doc.lastAutoTable.finalY + 8;
  const totalSinIVA = window.pedido.reduce((s,i) => s + i.costos.subtotal * i.cant, 0);
  const totalConIVA = window.pedido.reduce((s,i) => s + i.subtotalFinal, 0);
  const iva = totalConIVA - totalSinIVA;
  doc.setFontSize(9); doc.setTextColor(100,116,139);
  doc.text(`Subtotal sin IVA: $${Math.round(totalSinIVA).toLocaleString('es-AR')}`,195,y,{align:'right'});
  doc.text(`IVA (${document.getElementById('pIVA').value}%): $${Math.round(iva).toLocaleString('es-AR')}`,195,y+6,{align:'right'});
  if (dto > 0) doc.text(`Descuento (${dto*100}%): −$${Math.round(totalConIVA*dto).toLocaleString('es-AR')}`,195,y+12,{align:'right'});
  doc.setFillColor(13,17,23); doc.roundedRect(130,y+16,66,12,2,2,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(12); doc.setFont(undefined,'bold');
  doc.text(`TOTAL  $${Math.round(totalConIVA*(1-dto)).toLocaleString('es-AR')}`,163,y+24,{align:'center'});
  const h = doc.internal.pageSize.height;
  doc.setFontSize(8); doc.setTextColor(160,168,180); doc.setFont(undefined,'normal');
  doc.text('Este presupuesto tiene una validez de 7 días hábiles.',105,h-10,{align:'center'});
}

// ── PDF TALLER ──
function pdfTaller(doc) {
  const empresa  = document.getElementById('empresa').value   || 'Mi Empresa';
  const nro      = document.getElementById('nroPresup').value || '001';
  const fecha    = document.getElementById('fecha').value     || '';
  const cliente  = document.getElementById('cliente').value   || '—';
  const totalAlu = window.pedido.reduce((s,i) => s + i.metrosLineales * i.cant, 0);

  doc.setFillColor(26,127,55); doc.rect(0,0,210,38,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont(undefined,'bold');
  doc.text('HOJA DE TALLER',14,16);
  doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(200,235,210);
  doc.text(`${empresa}  ·  N° ${nro}  ·  ${fecha}`,14,24);
  doc.text(`Cliente: ${cliente}  ·  Aluminio total: ${totalAlu.toFixed(2)} m lineales`,14,32);

  let y = 46;
  window.pedido.forEach((item, idx) => {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFillColor(246,248,250); doc.rect(14,y-4,182,10,'F');
    doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(13,17,23);
    doc.text(`${idx+1}. ${item.desc}  —  ${CONFIG_LINEA[item.linea].nombre}  ${item.W}×${item.H}cm  (Cant: ${item.cant})`,16,y+3);
    y += 10;
    doc.setFontSize(9); doc.setFont(undefined,'normal');
    item.piezas.forEach(p => {
      doc.setTextColor(100,116,139); doc.text(p.grupo+':',18,y);
      doc.setTextColor(13,17,23);   doc.text(p.piezas+`  (${p.angulo})`,52,y);
      doc.setDrawColor(180,190,205); doc.rect(188,y-4,5,5);
      y += 7;
    });
    doc.setTextColor(100,116,139); doc.text('Vidrio:',18,y);
    doc.setTextColor(13,17,23);
    doc.text(`${item.vidNombre}  —  ${(((item.W-3)/100)*((item.H-3)/100)).toFixed(3)} m²`,52,y);
    y += 10;
    doc.setFontSize(8); doc.setTextColor(120,130,145);
    doc.text(`Aluminio: ${item.metrosLineales.toFixed(2)} m · ${(item.metrosLineales*item.cant).toFixed(2)} m total por cant.`,18,y);
    y += 10;
    doc.setDrawColor(220,225,230); doc.line(14,y-3,196,y-3);
  });

  y += 4;
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFillColor(13,17,23); doc.rect(14,y,182,8,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont(undefined,'bold');
  doc.text(`RESUMEN DE COMPRA — Aluminio total: ${totalAlu.toFixed(2)} m lineales`,16,y+5.5);
}

function exportarPDF(tipo) {
  if (!window.pedido || window.pedido.length === 0) { showToast('⚠️ No hay ítems en el pedido'); return; }
  const doc = new jsPDF();
  // Presupuesto/taller desactivado en esta vista.
  showToast('⚠️ Presupuesto/Hoja de taller desactivados');
}