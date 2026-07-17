// ══════════════════════════════════════════════
// NOTIFICACIONES — toast + Notification API
// ══════════════════════════════════════════════

let _notifLastOTCount = 0;
let _notifLastMovCount = 0;
let _notifInitialized = false;
let _notifPermission = 'default';

// Solicitar permiso de notificaciones del navegador
function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    _notifPermission = 'granted';
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => {
      _notifPermission = p;
    });
  } else {
    _notifPermission = 'denied';
  }
}

// Enviar notificación nativa del navegador
function sendNativeNotification(title, body, icon) {
  if (_notifPermission !== 'granted') return;
  try {
    new Notification(title, {
      body: body,
      icon: icon || undefined,
      badge: icon || undefined,
      silent: false,
      tag: 'workshop-' + Date.now(),
    });
  } catch (e) {
    // Notificaciones no soportadas o bloqueadas
  }
}

function checkNotificaciones() {
  const movimientos = window.movimientos || [];
  const ordenes = window.ordenesTrabajoData || [];

  if (!_notifInitialized) {
    _notifLastOTCount = ordenes.length;
    _notifLastMovCount = movimientos.filter(m => !m.esAmbos || m.montoOriginal > 0).length;
    _notifInitialized = true;
    requestNotificationPermission();
    return;
  }

  const newMovCount = movimientos.filter(m => !m.esAmbos || m.montoOriginal > 0).length;
  const newOTCount = ordenes.length;

  if (newOTCount > _notifLastOTCount) {
    const diff = newOTCount - _notifLastOTCount;
    showToast(`📦 ${diff} nueva${diff > 1 ? 's' : ''} orden${diff > 1 ? 'es' : ''} de trabajo`);
    sendNativeNotification(
      '📦 Nueva Orden de Trabajo',
      `${diff} nueva${diff > 1 ? 's' : ''} orden${diff > 1 ? 'es' : ''} registrada${diff > 1 ? 's' : ''}`
    );
  }

  if (newMovCount > _notifLastMovCount) {
    const diff = newMovCount - _notifLastMovCount;
    showToast(`💸 ${diff} nuevo${diff > 1 ? 's' : ''} movimiento${diff > 1 ? 's' : ''}`);
    sendNativeNotification(
      '💸 Nuevo Movimiento',
      `${diff} nuevo${diff > 1 ? 's' : ''} movimiento${diff > 1 ? 's' : ''} registrado${diff > 1 ? 's' : ''}`
    );
  }

  _notifLastOTCount = newOTCount;
  _notifLastMovCount = newMovCount;
}
