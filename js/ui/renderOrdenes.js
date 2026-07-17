// ══════════════════════════════════════════════
// RENDER — Órdenes de Trabajo
// ══════════════════════════════════════════════

function renderCostosTemp() {
  const lista = document.getElementById('ot-costos-lista');
  if (otCostosTemp.length === 0) { lista.innerHTML = ''; return; }
  const origenLabel = { windowscenter: '🏢 WC', adrian: '👤 Adrian', enzo: '👤 Enzo' };
  lista.innerHTML = otCostosTemp.map((c, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--surface);border:1px solid var(--line);border-radius:6px;font-size:12px">
      <span style="flex:1">${window._escHtml ? _escHtml(c.desc) : c.desc}</span>
      <span style="font-size:10px;color:rgba(100,116,139,0.8);background:rgba(100,116,139,0.1);padding:2px 6px;border-radius:4px">${origenLabel[c.origen] || 'WC'}</span>
      <span class="pago-badge ${c.medio === 'transferencia' ? 'pago-transferencia' : 'pago-efectivo'}">${c.medio === 'transferencia' ? '🏦' : '💵'}</span>
      <span style="font-weight:700;color:var(--red)">−$${(c.monto || 0).toLocaleString('es-AR')}</span>
      <button class="action-btn" onclick="quitarCostoTemp(${i})" style="padding:3px">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg>
      </button>
    </div>`).join('');
}

function generarIdOT(o) {
  const ordenes = window.ordenesTrabajoData || [];
  const sorted = ordenes.slice().sort(function(a, b) { return (a.id || '').localeCompare(b.id || ''); });
  for (var i = 0; i < sorted.length; i++) {
    if (sorted[i].id === o.id) return '#' + String(i + 1).padStart(3, '0');
  }
  return '#' + String(sorted.length).padStart(3, '0');
}

function enviarWhatsAppOT(id) {
  const o = (window.ordenesTrabajoData || []).find(function(x) { return x.id === id; });
  if (!o) return;
  const saldo = (o.venta || 0) - (o.sena || 0);
  var txt = '📦 *Orden de Trabajo ' + generarIdOT(o) + '*\n\n';
  txt += '👤 Cliente: ' + o.cliente + '\n';
  txt += '📋 Trabajo: ' + o.desc + '\n';
  if (o.fechaEntrega) txt += '📅 Entrega: ' + fmtFechaCorta(o.fechaEntrega) + '\n';
  txt += '\n💰 *Precio: $' + (o.venta || 0).toLocaleString('es-AR') + '*\n';
  if ((o.sena || 0) > 0) txt += '🤝 Seña: $' + o.sena.toLocaleString('es-AR') + '\n';
  if (saldo > 0) txt += '⏳ Resta: $' + saldo.toLocaleString('es-AR') + '\n';
  txt += '\n_Elaborado por WindowsCenter_';
  if (navigator.share) {
    navigator.share({ text: txt }).catch(function() {});
  } else {
    var waUrl = 'https://wa.me/?text=' + encodeURIComponent(txt);
    window.open(waUrl, '_blank');
  }
  showToast('📋 Mensaje copiado — pegalo en WhatsApp');
}

function renderOrdenesTrabajoLista() {
  const lista = document.getElementById('ot-lista');
  const ordenes = window.ordenesTrabajoData || [];
  if (!lista) return;
  if (ordenes.length === 0) {
    lista.innerHTML = `<div class="empty-state" style="background:var(--white);border:1px solid var(--line);border-radius:var(--radius-lg);padding:60px"><div class="empty-icon">📦</div><h3>Sin órdenes de trabajo</h3><p>Cargá tu primera orden arriba para ver el detalle de ganancias.</p></div>`;
    return;
  }

  const filtradas = aplicarFiltrosOT(ordenes);
  const countEl = document.getElementById('ot-filtro-count');
  if (countEl) {
    countEl.textContent = filtradas.length !== ordenes.length
      ? `${filtradas.length} de ${ordenes.length} órdenes`
      : `${ordenes.length} órdenes`;
  }

  renderAlertasPendientes(ordenes);
  renderEntregasProximas(ordenes);
  renderAgendaSemanal(ordenes);

  const personaLabelOTCard = p => labelPersonaGestion(p === 'ambos' ? 'windowscenter' : p, false, true);

  lista.innerHTML = filtradas.slice().reverse().map(o => {
    const saldo       = (o.venta || 0) - (o.sena || 0);
    const ganPct      = o.venta > 0 ? Math.round(((o.ganancia || 0) / o.venta) * 100) : 0;
    const estado      = getEstadoOT(o.estado);
    const otId        = generarIdOT(o);
    const costosHTML  = (o.costos||[]).map(c => {
      const origenLabel = { windowscenter: '🏢 WC', adrian: '👤 Adrian', enzo: '👤 Enzo' };
      return `
      <div class="costo-row">
        <span style="color:var(--ink2)">${window._escHtml ? _escHtml(c.desc) : c.desc}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:rgba(100,116,139,0.8);background:rgba(100,116,139,0.1);padding:2px 6px;border-radius:4px">${origenLabel[c.origen] || '🏢 WC'}</span>
          <span class="pago-badge ${c.medio==='transferencia'?'pago-transferencia':'pago-efectivo'}">${c.medio==='transferencia'?'🏦 Trans.':'💵 Efec.'}</span>
          <span style="font-weight:600;color:var(--red)">−$${(c.monto || 0).toLocaleString('es-AR')}</span>
        </div>
      </div>`
    }).join('');

    return `<div class="orden-card" id="ot-card-${o.id}">
      <div class="orden-header" onclick="toggleOrden('${o.id}')" id="ot-hdr-${o.id}">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          <span style="font-size:10px;font-weight:700;color:var(--ink3);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:2px 6px;flex-shrink:0">${otId}</span>
          <span class="orden-estado" style="background:${estado.bg};color:${estado.color};border:1px solid ${estado.border}">${estado.label}</span>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${window._escHtml ? _escHtml(o.cliente) : o.cliente}</div>
            <div style="font-size:11px;color:var(--ink3);margin-top:1px">${window._escHtml ? _escHtml(o.desc) : o.desc} · ${personaLabelOTCard(o.persona || 'windowscenter')}${o.fechaEntrega?' · Entrega: '+fmtFechaCorta(o.fechaEntrega):''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--ink3)">Venta</div>
            <div style="font-weight:700;font-size:15px">$${(o.venta || 0).toLocaleString('es-AR')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--ink3)">Ganancia</div>
            <div style="font-weight:700;font-size:15px;color:${(o.ganancia || 0) >= 0 ? 'var(--green)' : 'var(--red)'}">$${(o.ganancia || 0).toLocaleString('es-AR')}</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="action-btn" onclick="event.stopPropagation();enviarWhatsAppOT('${o.id}')" title="Enviar por WhatsApp" style="color:#25d366">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button class="action-btn" onclick="event.stopPropagation();abrirEditarOT('${o.id}')" title="Editar" style="color:var(--blue)">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286Z"/></svg>
            </button>
            <button class="action-btn" onclick="event.stopPropagation();abrirEditarCostosOT('${o.id}')" title="Editar costos" style="color:var(--amber)">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.75 0a.75.75 0 0 1 .75.75V3h3.634c.414 0 .814.147 1.13.414l2.07 1.75a1.75 1.75 0 0 1 0 2.672l-2.07 1.75a1.75 1.75 0 0 1-1.13.414H8.5v5.25a.75.75 0 0 1-1.5 0V10H2.75A1.75 1.75 0 0 1 1 8.25v-3.5C1 3.784 1.784 3 2.75 3H7V.75A.75.75 0 0 1 7.75 0Zm4.384 8.5a.25.25 0 0 0 .161-.06l2.07-1.75a.248.248 0 0 0 0-.38l-2.07-1.75a.25.25 0 0 0-.161-.06H2.75a.25.25 0 0 0-.25.25v3.5c0 .138.112.25.25.25h9.134Z"/></svg>
            </button>
            <button class="action-btn" onclick="event.stopPropagation();confirmarBorrarOT('${o.id}')" title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg>
            </button>
            <button class="action-btn" onclick="event.stopPropagation();duplicarOT('${o.id}')" title="Duplicar orden" style="color:var(--green)">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25ZM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="orden-body" id="ot-body-${o.id}">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-bottom:4px">💰 Precio de venta</div>
            <div style="font-size:18px;font-weight:700">$${(o.venta || 0).toLocaleString('es-AR')}</div>
          </div>
          <div style="background:var(--blue-bg);border:1px solid rgba(9,105,218,0.2);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--blue);text-transform:uppercase;font-weight:600;margin-bottom:4px">🤝 Seña recibida</div>
            <div style="font-size:18px;font-weight:700;color:var(--blue)">$${(o.sena || 0).toLocaleString('es-AR')}</div>
            <div style="font-size:10px;color:var(--blue);margin-top:2px">${(o.sena||0)>0?((o.senaMedio||'efectivo')==='transferencia'?'🏦 Transferencia':'💵 Efectivo'):'Sin seña'}</div>
          </div>
          <div style="background:${saldo>0?'var(--amber-bg)':'var(--green-bg)'};border:1px solid ${saldo>0?'rgba(154,103,0,0.2)':'rgba(26,127,55,0.2)'};border-radius:8px;padding:12px">
            <div style="font-size:10px;color:${saldo>0?'var(--amber)':'var(--green)'};text-transform:uppercase;font-weight:600;margin-bottom:4px">⏳ Resta cobrar</div>
            <div style="font-size:18px;font-weight:700;color:${saldo>0?'var(--amber)':'var(--green)'}">$${saldo.toLocaleString('es-AR')}</div>
            <div style="font-size:10px;color:${saldo>0?'var(--amber)':'var(--green)'};margin-top:2px">${saldo>0?(o.saldoMedio==='transferencia'?'🏦 Transferencia':'💵 Efectivo'):'Cobrado ✓'}</div>
          </div>
          <div style="background:var(--red-bg);border:1px solid rgba(207,34,46,0.2);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--red);text-transform:uppercase;font-weight:600;margin-bottom:4px">📋 Total costos</div>
            <div style="font-size:18px;font-weight:700;color:var(--red)">$${(o.totalCostos || 0).toLocaleString('es-AR')}</div>
          </div>
        </div>

        ${(o.costos||[]).length > 0 ? `
        <div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:600;color:var(--ink2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">📋 Costos del trabajo</div>
          ${costosHTML}
          <div style="display:flex;justify-content:flex-end;padding-top:8px;font-size:12px;color:var(--ink3)">
            Total: <span style="font-weight:700;color:var(--red);margin-left:6px">−$${(o.totalCostos || 0).toLocaleString('es-AR')}</span>
          </div>
        </div>` : '<div style="font-size:12px;color:var(--ink3);margin-bottom:12px;text-align:center;padding:10px">Sin costos registrados</div>'}

        <div class="ganancia-box">
          <div>
            <div style="font-size:11px;color:rgba(63,185,80,0.7);text-transform:uppercase;font-weight:600;letter-spacing:.08em">📈 Ganancia neta del trabajo</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px">Venta $${(o.venta || 0).toLocaleString('es-AR')} − Costos $${(o.totalCostos || 0).toLocaleString('es-AR')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:26px;font-weight:700;color:${(o.ganancia || 0) >= 0 ? '#3fb950' : '#f85149'}">$${(o.ganancia || 0).toLocaleString('es-AR')}</div>
            <div style="font-size:11px;color:${(o.ganancia || 0) >= 0 ? 'rgba(63,185,80,0.6)' : 'rgba(248,81,73,0.6)'}">${ganPct}% sobre venta</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.renderOrdenesTrabajoLista = renderOrdenesTrabajoLista;

function aplicarFiltroOT() {
  renderOrdenesTrabajoLista();
}
window.aplicarFiltroOT = aplicarFiltroOT;