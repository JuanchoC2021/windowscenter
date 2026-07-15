// ══════════════════════════════════════════════
// RENDER — Descuentos a WindowsCenter
// ══════════════════════════════════════════════

window.renderDescuentosWC = function() {
  const lista    = window.descuentosWC || [];
  const movimientos = window.movimientos || [];
  const ordenes  = window.ordenesTrabajoData || [];

  // Usar getTotalesWindowsCenter() para consistencia con el panel principal
  const totalesWC = getTotalesWindowsCenter();
  const cajaBruta = totalesWC.cajaBruta;
  const totalDescuentos = totalesWC.totalDescuentos;
  const netoWC = totalesWC.netoWC;

  // Actualizar cards del panel detalle
  const fmt = v => { const el=document.getElementById(v[0]); if(el){el.textContent='$'+v[1].toLocaleString('es-AR'); if(v[2]!==undefined)el.style.color=v[2];} };
  fmt(['wc-detail-caja', cajaBruta, '#3fb950']);
  fmt(['wc-detail-descuentos', totalDescuentos, '#f85149']);
  fmt(['wc-detail-neto', netoWC, netoWC>=0?'#79c0ff':'#f85149']);
  const cntEl = document.getElementById('wc-detail-desc-count');
  if (cntEl) cntEl.textContent = lista.length + ' descuento' + (lista.length!==1?'s':'') + ' registrado' + (lista.length!==1?'s':'');

  // Actualizar mini-panel del dashboard
  const setMini = (id,val,color) => { const el=document.getElementById(id); if(el){el.textContent='$'+val.toLocaleString('es-AR'); if(color)el.style.color=color;} };
  setMini('wc-caja-bruta', cajaBruta, '#3fb950');
  setMini('wc-total-descuentos', totalDescuentos, '#f85149');
  setMini('wc-neto', netoWC, netoWC>=0?'#79c0ff':'#f85149');
  const descCountEl = document.getElementById('wc-desc-count');
  if (descCountEl) descCountEl.textContent = lista.length + ' descuento' + (lista.length!==1?'s':'');

  // Renderizar tabla
  const tbody = document.getElementById('wc-historial-body');
  if (!tbody) return;
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state" style="padding:40px"><div class="empty-icon">🏢</div><h3>Sin descuentos registrados</h3><p>Registrá sueldos, retiros o saldos a favor para descontarlos de la caja de WindowsCenter.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(d => {
    const tipoLabel = WC_TIPOS[d.tipo] || d.tipo;
    const medioLabel = d.medio === 'transferencia' ? '<span class="pago-badge pago-transferencia">🏦 Transferencia</span>' : '<span class="pago-badge pago-efectivo">💵 Efectivo</span>';
    return `<tr>
      <td style="font-size:11px;color:var(--ink3);white-space:nowrap">${d.fecha}</td>
      <td><span class="badge" style="background:var(--red-bg);color:var(--red);border:1px solid rgba(207,34,46,0.2)">${tipoLabel}</span></td>
      <td style="font-weight:500">${d.desc}</td>
      <td>${medioLabel}</td>
      <td style="text-align:right;font-weight:700;color:var(--red)">−$${d.monto.toLocaleString('es-AR')}</td>
      <td><button class="action-btn" onclick="confirmarBorrarDescuentoWC('${d.id}')" title="Eliminar"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg></button></td>
    </tr>`;
  }).join('');
};
window.renderDescuentosWC = window.renderDescuentosWC;