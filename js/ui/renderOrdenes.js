// ══════════════════════════════════════════════
// RENDER — Órdenes de Trabajo
// ══════════════════════════════════════════════

function renderCostosTemp() {
  const lista = document.getElementById('ot-costos-lista');
  if (otCostosTemp.length === 0) { lista.innerHTML = ''; return; }
  const origenLabel = { windowscenter: '🏢 WC', adrian: '👤 Adrian', enzo: '👤 Enzo' };
  lista.innerHTML = otCostosTemp.map((c, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--surface);border:1px solid var(--line);border-radius:6px;font-size:12px">
      <span style="flex:1">${c.desc}</span>
      <span style="font-size:10px;color:rgba(100,116,139,0.8);background:rgba(100,116,139,0.1);padding:2px 6px;border-radius:4px">${origenLabel[c.origen] || 'WC'}</span>
      <span class="pago-badge ${c.medio === 'transferencia' ? 'pago-transferencia' : 'pago-efectivo'}">${c.medio === 'transferencia' ? '🏦' : '💵'}</span>
      <span style="font-weight:700;color:var(--red)">−$${c.monto.toLocaleString('es-AR')}</span>
      <button class="action-btn" onclick="quitarCostoTemp(${i})" style="padding:3px">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg>
      </button>
    </div>`).join('');
}

function renderOrdenesTrabajoLista() {
  const lista = document.getElementById('ot-lista');
  const ordenes = window.ordenesTrabajoData || [];
  if (ordenes.length === 0) {
    lista.innerHTML = `<div class="empty-state" style="background:var(--white);border:1px solid var(--line);border-radius:var(--radius-lg);padding:60px"><div class="empty-icon">📦</div><h3>Sin órdenes de trabajo</h3><p>Cargá tu primera orden arriba para ver el detalle de ganancias.</p></div>`;
    return;
  }
  const estadoClass = { pendiente: 'estado-pendiente', senal: 'estado-senal', cobrado: 'estado-cobrado' };
  const estadoLabel = { pendiente: '⏳ Pendiente', senal: '💰 Con seña', cobrado: '✅ Cobrado' };
  const personaLabelOTCard = p => labelPersonaGestion(p === 'ambos' ? 'windowscenter' : p, false, true);

  lista.innerHTML = ordenes.slice().reverse().map(o => {
    const saldo       = o.venta - o.sena;
    const ganPct      = o.venta > 0 ? Math.round((o.ganancia / o.venta) * 100) : 0;
    const costosHTML  = (o.costos||[]).map(c => {
      const origenLabel = { windowscenter: '🏢 WC', adrian: '👤 Adrian', enzo: '👤 Enzo' };
      return `
      <div class="costo-row">
        <span style="color:var(--ink2)">${c.desc}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:rgba(100,116,139,0.8);background:rgba(100,116,139,0.1);padding:2px 6px;border-radius:4px">${origenLabel[c.origen] || '🏢 WC'}</span>
          <span class="pago-badge ${c.medio==='transferencia'?'pago-transferencia':'pago-efectivo'}">${c.medio==='transferencia'?'🏦 Trans.':'💵 Efec.'}</span>
          <span style="font-weight:600;color:var(--red)">−$${c.monto.toLocaleString('es-AR')}</span>
        </div>
      </div>`
    }).join('');

    return `<div class="orden-card" id="ot-card-${o.id}">
      <div class="orden-header" onclick="toggleOrden('${o.id}')" id="ot-hdr-${o.id}">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          <span class="orden-estado ${estadoClass[o.estado]||'estado-pendiente'}">${estadoLabel[o.estado]||o.estado}</span>
          <div style="min-width:0">
            <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.cliente}</div>
            <div style="font-size:11px;color:var(--ink3);margin-top:1px">${o.desc} · ${personaLabelOTCard(o.persona || 'windowscenter')}${o.fechaEntrega?' · Entrega: '+o.fechaEntrega:''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--ink3)">Venta</div>
            <div style="font-weight:700;font-size:15px">$${o.venta.toLocaleString('es-AR')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--ink3)">Ganancia</div>
            <div style="font-weight:700;font-size:15px;color:${o.ganancia>=0?'var(--green)':'var(--red)'}">$${o.ganancia.toLocaleString('es-AR')}</div>
          </div>
          <div style="display:flex;gap:4px">
            <button class="action-btn" onclick="event.stopPropagation();abrirEditarOT('${o.id}')" title="Editar" style="color:var(--blue)">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286Z"/></svg>
            </button>
            <button class="action-btn" onclick="event.stopPropagation();confirmarBorrarOT('${o.id}')" title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15Z"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="orden-body" id="ot-body-${o.id}">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-bottom:4px">💰 Precio de venta</div>
            <div style="font-size:18px;font-weight:700">$${o.venta.toLocaleString('es-AR')}</div>
          </div>
          <div style="background:var(--blue-bg);border:1px solid rgba(9,105,218,0.2);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--blue);text-transform:uppercase;font-weight:600;margin-bottom:4px">🤝 Seña recibida</div>
            <div style="font-size:18px;font-weight:700;color:var(--blue)">$${o.sena.toLocaleString('es-AR')}</div>
            <div style="font-size:10px;color:var(--blue);margin-top:2px">${o.sena>0?(o.senaMedio==='transferencia'?'🏦 Transferencia':'💵 Efectivo'):'Sin seña'}</div>
          </div>
          <div style="background:${saldo>0?'var(--amber-bg)':'var(--green-bg)'};border:1px solid ${saldo>0?'rgba(154,103,0,0.2)':'rgba(26,127,55,0.2)'};border-radius:8px;padding:12px">
            <div style="font-size:10px;color:${saldo>0?'var(--amber)':'var(--green)'};text-transform:uppercase;font-weight:600;margin-bottom:4px">⏳ Resta cobrar</div>
            <div style="font-size:18px;font-weight:700;color:${saldo>0?'var(--amber)':'var(--green)'}">$${saldo.toLocaleString('es-AR')}</div>
            <div style="font-size:10px;color:${saldo>0?'var(--amber)':'var(--green)'};margin-top:2px">${saldo>0?(o.saldoMedio==='transferencia'?'🏦 Transferencia':'💵 Efectivo'):'Cobrado ✓'}</div>
          </div>
          <div style="background:var(--red-bg);border:1px solid rgba(207,34,46,0.2);border-radius:8px;padding:12px">
            <div style="font-size:10px;color:var(--red);text-transform:uppercase;font-weight:600;margin-bottom:4px">📋 Total costos</div>
            <div style="font-size:18px;font-weight:700;color:var(--red)">$${o.totalCostos.toLocaleString('es-AR')}</div>
          </div>
        </div>

        ${(o.costos||[]).length > 0 ? `
        <div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:600;color:var(--ink2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">📋 Costos del trabajo</div>
          ${costosHTML}
          <div style="display:flex;justify-content:flex-end;padding-top:8px;font-size:12px;color:var(--ink3)">
            Total: <span style="font-weight:700;color:var(--red);margin-left:6px">−$${o.totalCostos.toLocaleString('es-AR')}</span>
          </div>
        </div>` : '<div style="font-size:12px;color:var(--ink3);margin-bottom:12px;text-align:center;padding:10px">Sin costos registrados</div>'}

        <div class="ganancia-box">
          <div>
            <div style="font-size:11px;color:rgba(63,185,80,0.7);text-transform:uppercase;font-weight:600;letter-spacing:.08em">📈 Ganancia neta del trabajo</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px">Venta $${o.venta.toLocaleString('es-AR')} − Costos $${o.totalCostos.toLocaleString('es-AR')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:26px;font-weight:700;color:${o.ganancia>=0?'#3fb950':'#f85149'}">$${o.ganancia.toLocaleString('es-AR')}</div>
            <div style="font-size:11px;color:${o.ganancia>=0?'rgba(63,185,80,0.6)':'rgba(248,81,73,0.6)'}">${ganPct}% sobre venta</div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.renderOrdenesTrabajoLista = renderOrdenesTrabajoLista;