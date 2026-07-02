// Configuración editable persistida en la tabla `settings`, con respaldo en
// variables de entorno cuando no hay valor guardado.

export function getSetting(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
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
