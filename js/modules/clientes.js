// ══════════════════════════════════════════════
// CLIENTES — base de clientes con historial
// Firestore collection: clientes
// Se mergea con clientes derivados de OTs
// ══════════════════════════════════════════════

function _safeAttr(str) {
  return String(str).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _safeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderClientes() {
  try {
    const lista = document.getElementById('clientes-lista');
    const countEl = document.getElementById('clientes-count');
    if (!lista) return;

    const ordenes = window.ordenesTrabajoData || [];
    const firestoreClientes = window.clientesData || [];
    const busqueda = (document.getElementById('cliente-busqueda')?.value || '').trim().toLowerCase();

    var clientesMap = {};
    firestoreClientes.forEach(function(c) {
      var nombre = (c.nombre || '').trim();
      if (!nombre) return;
      clientesMap[nombre] = {
        id: c.id,
        nombre: nombre,
        telefono: c.telefono || '',
        email: c.email || '',
        notas: c.notas || '',
        ordenes: [],
        totalVenta: 0,
        totalGanancia: 0,
        totalCostos: 0,
        source: 'firestore'
      };
    });

    ordenes.forEach(function(o) {
      var nombre = (o.cliente || '').trim();
      if (!nombre) return;
      if (!clientesMap[nombre]) {
        clientesMap[nombre] = {
          id: null,
          nombre: nombre,
          telefono: '',
          email: '',
          notas: '',
          ordenes: [],
          totalVenta: 0,
          totalGanancia: 0,
          totalCostos: 0,
          source: 'ot'
        };
      }
      clientesMap[nombre].ordenes.push(o);
      clientesMap[nombre].totalVenta += (o.venta || 0);
      clientesMap[nombre].totalGanancia += (o.ganancia || 0);
      clientesMap[nombre].totalCostos += (o.totalCostos || 0);
    });

    var clientes = Object.values(clientesMap);
    if (busqueda) {
      clientes = clientes.filter(function(c) {
        return c.nombre.toLowerCase().indexOf(busqueda) !== -1 ||
          (c.telefono || '').indexOf(busqueda) !== -1 ||
          (c.email || '').toLowerCase().indexOf(busqueda) !== -1;
      });
    }

    clientes.sort(function(a, b) {
      if (a.ordenes.length !== b.ordenes.length) return b.ordenes.length - a.ordenes.length;
      return a.nombre.localeCompare(b.nombre);
    });

    if (countEl) {
      countEl.textContent = clientes.length + ' cliente' + (clientes.length !== 1 ? 's' : '');
    }

    if (clientes.length === 0) {
      lista.innerHTML = '<div style="text-align:center;padding:30px;color:var(--ink3);font-size:13px">Sin clientes registrados. Creá uno con el botón de abajo.</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < clientes.length; i++) {
      var c = clientes[i];
      var ordenesSorted = c.ordenes.slice().sort(function(a, b) { return (b.id || '').localeCompare(a.id || ''); });
      var ultima = ordenesSorted.length > 0 ? ordenesSorted[0] : null;

      var estados = {};
      for (var j = 0; j < c.ordenes.length; j++) {
        var est = c.ordenes[j].estado || 'pendiente';
        estados[est] = (estados[est] || 0) + 1;
      }

      var idAttr = _safeAttr(c.id || '');
      var nombreHtml = _safeHtml(c.nombre);
      var nombreAttr = _safeAttr(c.nombre);

      var badgeHtml = '';
      var estKeys = Object.keys(estados);
      for (var k = 0; k < estKeys.length; k++) {
        var e = getEstadoOT(estKeys[k]);
        badgeHtml += '<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:' + e.bg + ';color:' + e.color + ';border:1px solid ' + e.border + '">' + _safeHtml(e.label) + ' ' + estados[estKeys[k]] + '</span> ';
      }

      var ordenInfo = '';
      if (c.ordenes.length > 0) {
        var ultimaFecha = ultima ? fmtFechaCorta(ultima.fechaRegistro || ultima.fechaCreacion || '') : '—';
        ordenInfo = c.ordenes.length + ' orden' + (c.ordenes.length > 1 ? 'es' : '') + ' · Última: ' + ultimaFecha;
      }

      var contactInfo = '';
      if (c.telefono || c.email) {
        contactInfo = ' · 📞 ' + (c.telefono || '') + (c.email ? ' · ✉️ ' + c.email : '');
      }

      var ventaHtml = '';
      if (c.totalVenta > 0) {
        var gananciaColor = c.totalGanancia >= 0 ? 'var(--green)' : 'var(--red)';
        ventaHtml = '<div style="font-size:12px;font-weight:700;color:var(--green)">$' + c.totalVenta.toLocaleString('es-AR') + '</div>' +
          '<div style="font-size:10px;color:' + gananciaColor + '">Ganancia: $' + c.totalGanancia.toLocaleString('es-AR') + '</div>';
      }

      var editBtnLabel = c.id ? '✏️ Editar' : '💾 Guardar datos';
      var editBtnStyle = 'font-size:10px;padding:4px 8px;color:var(--blue);border-color:var(--blue)';
      var deleteBtnHtml = c.id
        ? '<button class="btn btn-outline btn-sm" onclick="event.stopPropagation();borrarCliente(\'' + idAttr + '\',\'' + nombreAttr + '\')" style="font-size:10px;padding:4px 8px;color:var(--red);border-color:var(--red)">🗑️</button>'
        : '';

      var OTorContactLabel = c.ordenes.length > 0
        ? ordenInfo
        : '<span style="color:var(--purple)">Sin órdenes — contacto registrado</span>';

      html += '<div style="padding:12px 14px;background:var(--surface);border:1px solid var(--line);border-radius:8px;transition:border-color 0.2s">' +
        '<div style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="abrirClienteDetalle(\'' + nombreAttr + '\')">' +
          '<div style="width:36px;height:36px;border-radius:50%;background:rgba(130,80,223,0.12);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--purple);flex-shrink:0">' + _safeHtml(c.nombre.charAt(0).toUpperCase()) + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + nombreHtml + '</div>' +
            '<div style="font-size:11px;color:var(--ink3);margin-top:2px">' +
              OTorContactLabel + contactInfo +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0">' + ventaHtml + '</div>' +
          '<div style="display:flex;gap:4px">' + badgeHtml + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)">' +
          '<button class="btn btn-outline btn-sm" onclick="event.stopPropagation();editarCliente(\'' + idAttr + '\',\'' + nombreAttr + '\')" style="' + editBtnStyle + '">' + editBtnLabel + '</button>' +
          deleteBtnHtml +
        '</div>' +
      '</div>';
    }

    lista.innerHTML = html;
  } catch(err) {
    console.error('renderClientes error:', err);
    var lista = document.getElementById('clientes-lista');
    if (lista) {
      lista.innerHTML = '<div style="text-align:center;padding:30px;color:var(--red);font-size:13px">Error al renderizar clientes. Revisá la consola (F12).</div>';
    }
  }
}

function abrirClienteDetalle(nombre) {
  try {
    var ordenes = (window.ordenesTrabajoData || []).filter(function(o) { return (o.cliente || '').trim() === nombre; });
    var fsCliente = (window.clientesData || []).find(function(c) { return (c.nombre || '').trim() === nombre; });

    var container = document.getElementById('clientes-lista');
    if (container && container.parentElement) container.parentElement.style.display = 'none';
    var detalle = document.getElementById('cliente-detalle');
    if (!detalle) return;
    detalle.style.display = 'block';

    var nombreEl = document.getElementById('cliente-detalle-nombre');
    if (nombreEl) nombreEl.innerHTML = '👤 ' + _safeHtml(nombre) + ' <button onclick="abrirRenombrarCliente(\'' + _safeAttr(nombre) + '\')" style="font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid var(--line2);background:var(--surface);color:var(--ink3);cursor:pointer;margin-left:8px;vertical-align:middle">✏️ Renombrar</button>';

    var totalVenta = 0, totalGanancia = 0, totalCostos = 0;
    for (var i = 0; i < ordenes.length; i++) {
      totalVenta += (ordenes[i].venta || 0);
      totalGanancia += (ordenes[i].ganancia || 0);
      totalCostos += (ordenes[i].totalCostos || 0);
    }

    var movimientos = (window.movimientos || []).filter(function(m) {
      return ((m.desc || '').toLowerCase()).indexOf(nombre.toLowerCase()) !== -1;
    });
    var totalMovimientos = 0;
    for (var j = 0; j < movimientos.length; j++) {
      var m = movimientos[j];
      var val = m.monto || 0;
      totalMovimientos += (m.tipo === 'ingreso' ? val : -val);
    }

    var statsHtml = '<div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;text-align:center">' +
      '<div style="font-size:9px;color:var(--ink3);text-transform:uppercase;font-weight:600">Órdenes</div>' +
      '<div style="font-size:22px;font-weight:700;color:var(--ink)">' + ordenes.length + '</div>' +
      '<div style="font-size:10px;color:var(--ink3);margin-top:2px">Costos: $' + totalCostos.toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<div style="background:rgba(63,185,80,0.08);border:1px solid rgba(63,185,80,0.2);border-radius:8px;padding:12px;text-align:center">' +
      '<div style="font-size:9px;color:var(--green);text-transform:uppercase;font-weight:600">Total venta</div>' +
      '<div style="font-size:22px;font-weight:700;color:var(--green)">$' + totalVenta.toLocaleString('es-AR') + '</div>' +
      '<div style="font-size:10px;color:var(--green);margin-top:2px">Ganancia: $' + totalGanancia.toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<div style="background:rgba(88,166,255,0.08);border:1px solid rgba(88,166,255,0.2);border-radius:8px;padding:12px;text-align:center">' +
      '<div style="font-size:9px;color:var(--blue);text-transform:uppercase;font-weight:600">Movimientos</div>' +
      '<div style="font-size:22px;font-weight:700;color:var(--blue)">' + movimientos.length + '</div>' +
      '<div style="font-size:10px;color:' + (totalMovimientos >= 0 ? 'var(--green)' : 'var(--red)') + ';margin-top:2px">Neto: $' + Math.abs(totalMovimientos).toLocaleString('es-AR') + '</div>' +
    '</div>';

    if (fsCliente) {
      var contactParts = '';
      if (fsCliente.telefono) contactParts += '<div>📞 <b>' + _safeHtml(fsCliente.telefono) + '</b></div>';
      if (fsCliente.email) contactParts += '<div>✉️ <b>' + _safeHtml(fsCliente.email) + '</b></div>';
      if (fsCliente.notas) contactParts += '<div style="flex:1;color:var(--ink2)">' + _safeHtml(fsCliente.notas) + '</div>';
      if (!fsCliente.telefono && !fsCliente.email && !fsCliente.notas) contactParts = '<div style="color:var(--ink3)">Sin datos de contacto</div>';
      statsHtml += '<div style="background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:12px;grid-column:1/-1">' +
        '<div style="font-size:9px;color:var(--ink3);text-transform:uppercase;font-weight:600;margin-bottom:6px">📇 Datos de contacto</div>' +
        '<div style="display:flex;gap:16px;font-size:12px;flex-wrap:wrap">' + contactParts + '</div>' +
      '</div>';
    }

    var statsEl = document.getElementById('cliente-detalle-stats');
    if (statsEl) statsEl.innerHTML = statsHtml;

    var otsHtml = '';
    if (ordenes.length > 0) {
      otsHtml += '<div style="font-size:11px;font-weight:600;color:var(--ink2);margin-bottom:6px;text-transform:uppercase">📦 Órdenes de trabajo</div>';
      var reversed = ordenes.slice().reverse();
      for (var k = 0; k < reversed.length; k++) {
        var o = reversed[k];
        var est = getEstadoOT(o.estado);
        var saldo = (o.venta || 0) - (o.sena || 0);
        var saldoColor = saldo > 0 ? 'var(--amber)' : 'var(--green)';
        var ganColor = (o.ganancia || 0) >= 0 ? 'var(--green)' : 'var(--red)';
        otsHtml += '<div style="padding:12px;background:var(--surface);border:1px solid var(--line);border-radius:8px">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
            '<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:' + est.bg + ';color:' + est.color + ';border:1px solid ' + est.border + '">' + _safeHtml(est.label) + '</span>' +
            '<span style="font-weight:700;font-size:13px;flex:1">' + _safeHtml(o.desc || '—') + '</span>' +
            '<span style="font-size:11px;color:var(--ink3)">' + fmtFechaCorta(o.fechaRegistro || o.fechaCreacion || '') + '</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;font-size:11px">' +
            '<div><span style="color:var(--ink3)">Venta:</span> <b>$' + (o.venta || 0).toLocaleString('es-AR') + '</b></div>' +
            '<div><span style="color:var(--ink3)">Seña:</span> <b style="color:var(--blue)">$' + (o.sena || 0).toLocaleString('es-AR') + '</b></div>' +
            '<div><span style="color:var(--ink3)">Resta:</span> <b style="color:' + saldoColor + '">$' + saldo.toLocaleString('es-AR') + '</b></div>' +
            '<div><span style="color:var(--ink3)">Ganancia:</span> <b style="color:' + ganColor + '">$' + (o.ganancia || 0).toLocaleString('es-AR') + '</b></div>' +
          '</div>' +
        '</div>';
      }
    } else {
      otsHtml = '<div style="text-align:center;padding:20px;color:var(--ink3);font-size:12px">Este cliente no tiene órdenes registradas todavía.</div>';
    }

    if (movimientos.length > 0) {
      otsHtml += '<div style="font-size:11px;font-weight:600;color:var(--ink2);margin-top:14px;margin-bottom:6px;text-transform:uppercase">💸 Movimientos relacionados</div>';
      var reversedMov = movimientos.slice().reverse();
      for (var n = 0; n < reversedMov.length; n++) {
        var mov = reversedMov[n];
        var esIngreso = mov.tipo === 'ingreso';
        var valM = mov.monto || 0;
        var movBg = esIngreso ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)';
        var movColor = esIngreso ? 'var(--green)' : 'var(--red)';
        var movBorder = esIngreso ? 'rgba(63,185,80,0.2)' : 'rgba(248,81,73,0.2)';
        var medioClass = mov.medio === 'transferencia' ? 'pago-transferencia' : 'pago-efectivo';
        var medioIcon = mov.medio === 'transferencia' ? '🏦' : '💵';
        otsHtml += '<div style="padding:10px 12px;background:var(--surface);border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;gap:10px;font-size:12px">' +
          '<span style="font-size:10px;color:var(--ink3);white-space:nowrap">' + _safeHtml(mov.fecha || '—') + '</span>' +
          '<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:' + movBg + ';color:' + movColor + ';border:1px solid ' + movBorder + '">' + (esIngreso ? '↑ Ingreso' : '↓ Gasto') + '</span>' +
          '<span style="flex:1;color:var(--ink2)">' + _safeHtml(mov.desc || '') + '</span>' +
          '<span class="pago-badge ' + medioClass + '" style="font-size:10px">' + medioIcon + '</span>' +
          '<span style="font-weight:700;color:' + movColor + '">' + (esIngreso ? '+' : '−') + '$' + valM.toLocaleString('es-AR') + '</span>' +
        '</div>';
      }
    }

    var otsEl = document.getElementById('cliente-detalle-ots');
    if (otsEl) otsEl.innerHTML = otsHtml;
  } catch(err) {
    console.error('abrirClienteDetalle error:', err);
  }
}

function cerrarClienteDetalle() {
  try {
    var detalle = document.getElementById('cliente-detalle');
    if (detalle) detalle.style.display = 'none';
    var container = document.getElementById('clientes-lista');
    if (container && container.parentElement) container.parentElement.style.display = '';
  } catch(err) {
    console.error('cerrarClienteDetalle error:', err);
  }
}

function abrirCrearCliente() {
  try {
    document.getElementById('cli-id').value = '';
    document.getElementById('cli-nombre').value = '';
    document.getElementById('cli-telefono').value = '';
    document.getElementById('cli-email').value = '';
    document.getElementById('cli-notas').value = '';
    document.getElementById('modal-cliente-title').textContent = '➕ Crear cliente';
    document.getElementById('modal-cliente').classList.add('open');
    setTimeout(function() { var el = document.getElementById('cli-nombre'); if (el) el.focus(); }, 100);
  } catch(err) {
    console.error('abrirCrearCliente error:', err);
  }
}

function cerrarModalCliente() {
  try {
    document.getElementById('modal-cliente').classList.remove('open');
  } catch(err) {
    console.error('cerrarModalCliente error:', err);
  }
}

async function guardarCliente() {
  try {
    var id = document.getElementById('cli-id').value;
    var nombre = document.getElementById('cli-nombre').value.trim();
    var telefono = document.getElementById('cli-telefono').value.trim();
    var email = document.getElementById('cli-email').value.trim();
    var notas = document.getElementById('cli-notas').value.trim();

    if (!nombre) {
      showToast('⚠️ El nombre es obligatorio');
      return;
    }

    var _fb = window._fb;
    var clienteId = id || ('cli_' + crypto.randomUUID());
    var existing = id ? (window.clientesData || []).find(function(c) { return c.id === id; }) : null;

    var clienteData = {
      id: clienteId,
      nombre: nombre,
      telefono: telefono,
      email: email,
      notas: notas,
      fechaCreacion: existing ? existing.fechaCreacion : new Date().toISOString(),
    };

    await _fb.setDoc(_fb.doc(_fb.db, "clientes", clienteId), clienteData);
    cerrarModalCliente();
    showToast(id ? '✓ Cliente actualizado' : '✓ Cliente creado');
  } catch(e) {
    window._fb.setSyncStatus('error', 'Error');
    showToast('❌ Error al guardar cliente');
    console.error('guardarCliente:', e);
  }
}

function editarCliente(id, nombre) {
  try {
    if (!id) {
      document.getElementById('cli-id').value = '';
      document.getElementById('cli-nombre').value = nombre;
      document.getElementById('cli-telefono').value = '';
      document.getElementById('cli-email').value = '';
      document.getElementById('cli-notas').value = '';
      document.getElementById('modal-cliente-title').textContent = '💾 Guardar datos de ' + nombre;
      document.getElementById('modal-cliente').classList.add('open');
      setTimeout(function() { var el = document.getElementById('cli-telefono'); if (el) el.focus(); }, 100);
      return;
    }

    var c = (window.clientesData || []).find(function(x) { return x.id === id; });
    if (!c) return;

    document.getElementById('cli-id').value = c.id;
    document.getElementById('cli-nombre').value = c.nombre;
    document.getElementById('cli-telefono').value = c.telefono || '';
    document.getElementById('cli-email').value = c.email || '';
    document.getElementById('cli-notas').value = c.notas || '';
    document.getElementById('modal-cliente-title').textContent = '✏️ Editar ' + c.nombre;
    document.getElementById('modal-cliente').classList.add('open');
    setTimeout(function() { var el = document.getElementById('cli-nombre'); if (el) el.focus(); }, 100);
  } catch(err) {
    console.error('editarCliente error:', err);
  }
}

function borrarCliente(id, nombre) {
  mostrarConfirm({
    icon: '🗑️',
    title: '¿Eliminar cliente?',
    msg: 'Se eliminarán los datos de contacto de "' + nombre + '". Las órdenes de trabajo no se borran.',
    btnLabel: 'Eliminar',
    btnClass: 'btn-outline',
    onOk: async function() {
      try {
        var _fb = window._fb;
        await _fb.deleteDoc(_fb.doc(_fb.db, "clientes", id));
        showToast('✓ Cliente eliminado');
      } catch(e) {
        window._fb.setSyncStatus('error', 'Error');
        showToast('❌ Error al eliminar');
        console.error('borrarCliente:', e);
      }
    }
  });
}

// ── RENOMBRAR CLIENTE EN MASA ──
function abrirRenombrarCliente(nombre) {
  document.getElementById('rc-old-nombre').value = nombre;
  document.getElementById('rc-nombre-actual').value = nombre;
  document.getElementById('rc-nuevo-nombre').value = '';
  document.getElementById('modal-renombrar-cliente').classList.add('open');
  setTimeout(function() { var el = document.getElementById('rc-nuevo-nombre'); if (el) el.focus(); }, 100);
}

function cerrarModalRenombrar() {
  document.getElementById('modal-renombrar-cliente').classList.remove('open');
}

async function renombrarCliente() {
  var oldNombre = document.getElementById('rc-old-nombre').value;
  var newNombre = document.getElementById('rc-nuevo-nombre').value.trim();
  if (!newNombre) { showToast('⚠️ Ingresá el nuevo nombre'); return; }
  if (newNombre === oldNombre) { showToast('⚠️ El nombre es igual al actual'); return; }

  var ordenes = window.ordenesTrabajoData || [];
  var count = ordenes.filter(function(o) { return (o.cliente || '').trim() === oldNombre; }).length;

  mostrarConfirm({
    icon: '✏️',
    title: 'Renombrar cliente',
    msg: '"' + oldNombre + '" → "' + newNombre + '"\nSe actualizarán ' + count + ' orden' + (count !== 1 ? 'es' : '') + ' de trabajo.',
    btnLabel: 'Renombrar',
    btnClass: 'btn-primary',
    onOk: async function() {
      try {
        var _fb = window._fb;
        var batch = [];
        for (var i = 0; i < ordenes.length; i++) {
          var o = ordenes[i];
          if ((o.cliente || '').trim() === oldNombre) {
            var updated = Object.assign({}, o, { cliente: newNombre });
            batch.push(_fb.setDoc(_fb.doc(_fb.db, "ordenesTrabajo", o.id), updated));
          }
        }
        await Promise.all(batch);
        showToast('✓ Cliente renombrado en ' + count + ' orden' + (count !== 1 ? 'es' : ''));
        cerrarModalRenombrar();
      } catch(e) {
        window._fb.setSyncStatus('error', 'Error');
        showToast('❌ Error al renombrar');
        console.error('renombrarCliente:', e);
      }
    }
  });
}

window.renderClientes = renderClientes;
window.abrirClienteDetalle = abrirClienteDetalle;
window.cerrarClienteDetalle = cerrarClienteDetalle;
window.abrirCrearCliente = abrirCrearCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.guardarCliente = guardarCliente;
window.editarCliente = editarCliente;
window.borrarCliente = borrarCliente;
window.abrirRenombrarCliente = abrirRenombrarCliente;
window.cerrarModalRenombrar = cerrarModalRenombrar;
window.renombrarCliente = renombrarCliente;
