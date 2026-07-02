// Configuración editable persistida en la tabla `settings`, con respaldo en
// variables de entorno cuando no hay valor guardado.
//
// Nota de seguridad: el CLIENT SECRET de Microsoft Graph NUNCA se guarda en la
// base de datos ni se expone por la API; vive solo en la variable de entorno
// GRAPH_CLIENT_SECRET.

export function getSetting(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row && row.value != null ? row.value : fallback;
}

export function setSetting(db, key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value == null ? null : String(value));
  return getSetting(db, key);
}

// Correo al que se envía el reporte mensual a finanzas.
export function getReportEmail(db) {
  return getSetting(db, 'report_email', process.env.REPORT_EMAIL || '');
}

// Correo que recibe el aviso de nuevas pre-reservas pendientes.
export function getAdminNotifyEmail(db) {
  return getSetting(db, 'admin_notify_email', process.env.ADMIN_NOTIFY_EMAIL || getReportEmail(db));
}

// --- Configuración de correo (transporte + remitente institucional + Graph) --

export function getMailTransport(db) {
  return getSetting(db, 'mail_transport', process.env.MAIL_TRANSPORT || 'console');
}

// Buzón institucional remitente (el "De:" de las notificaciones).
export function getMailSender(db) {
  return getSetting(db, 'mail_sender', process.env.GRAPH_SENDER || '');
}

export function getGraphTenantId(db) {
  return getSetting(db, 'graph_tenant_id', process.env.GRAPH_TENANT_ID || '');
}

export function getGraphClientId(db) {
  return getSetting(db, 'graph_client_id', process.env.GRAPH_CLIENT_ID || '');
}

// El secreto SOLO se lee de la variable de entorno.
export function getGraphClientSecret() {
  return process.env.GRAPH_CLIENT_SECRET || '';
}

export function hasGraphSecret() {
  return Boolean(process.env.GRAPH_CLIENT_SECRET);
}

// Vista de la configuración de correo para la interfaz (sin el secreto).
export function getMailConfig(db) {
  return {
    mail_transport: getMailTransport(db),
    mail_sender: getMailSender(db),
    admin_notify_email: getAdminNotifyEmail(db),
    report_email: getReportEmail(db),
    graph_tenant_id: getGraphTenantId(db),
    graph_client_id: getGraphClientId(db),
    has_graph_secret: hasGraphSecret(),
  };
}

// Claves editables desde la API (el secreto queda excluido a propósito).
export const EDITABLE_SETTINGS = [
  'report_email',
  'admin_notify_email',
  'mail_transport',
  'mail_sender',
  'graph_tenant_id',
  'graph_client_id',
];
