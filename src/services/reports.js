import { ROOM } from '../config.js';
import { getReportEmail, getSetting, setSetting } from './settings.js';

const COLUMNS = [
  'token', 'event_name', 'contact_email', 'start_date', 'end_date', 'duration_type',
  'half_block', 'total_days', 'rental_type', 'cost_usd', 'status',
  'are', 'org_id', 'gl_account', 'cost_center', 'created_at', 'decided_at',
];

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows, columns = COLUMNS) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')).join('\n');
  return rows.length ? `${header}\n${body}\n` : `${header}\n`;
}

// Reservas para el export on-demand del administrador (con filtros opcionales).
export function reservationsForReport(db, { from, to, status } = {}) {
  const where = [];
  const params = [];
  if (from) { where.push('start_date >= ?'); params.push(from); }
  if (to) { where.push('start_date <= ?'); params.push(to); }
  if (status) { where.push('status = ?'); params.push(status); }
  const sql = `SELECT * FROM reservations${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY start_date`;
  return db.prepare(sql).all(...params);
}

// Rango [primerDía, primerDíaSiguienteMes) para un mes 'YYYY-MM'.
export function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return [first, next];
}

// Reservas facturables del mes: External confirmadas cuya fecha de inicio cae en el mes.
export function monthlyBillable(db, month) {
  const [first, next] = monthRange(month);
  return db
    .prepare(
      `SELECT * FROM reservations
        WHERE rental_type = 'external' AND status = 'confirmed'
          AND start_date >= ? AND start_date < ?
        ORDER BY start_date`,
    )
    .all(first, next);
}

export function monthlyTotal(rows) {
  return rows.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
}

// 'YYYY-MM' del mes anterior a `now`.
export function previousMonth(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-11 (mes actual); el anterior es m
  const prev = new Date(Date.UTC(y, m - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Genera y "envía" el reporte de un mes al correo indicado (o el configurado).
export async function sendMonthlyReport(db, mailer, month, toEmail) {
  const to = toEmail || getReportEmail(db);
  const rows = monthlyBillable(db, month);
  const total = monthlyTotal(rows);
  const csv = toCsv(rows);
  const result = await mailer.send({
    to,
    subject: `Reporte de rentas Sala ${ROOM.id} — ${month}`,
    template: 'monthly_report',
    attachments: [{ filename: `reporte-${ROOM.id}-${month}.csv`, content: csv }],
    body: `<p>Reporte mensual de rentas de la Sala ${ROOM.id} (${month}).</p>
      <p>Reservas facturables (External confirmadas): <b>${rows.length}</b><br>
      Total: <b>${total} USD</b> (cobro por movimiento ICC).</p>
      <p>Se adjunta el detalle en CSV.</p>`,
  });
  setSetting(db, 'report_last_sent_month', month);
  return { to, month, count: rows.length, total, mail: result };
}

// Envía automáticamente el reporte del mes anterior si aún no se ha enviado.
export async function maybeRunMonthlyReport(db, mailer, now = new Date()) {
  const month = previousMonth(now);
  const already = getSetting(db, 'report_last_sent_month');
  if (already === month) return { sent: false, reason: 'ya enviado', month };
  if (!getReportEmail(db)) return { sent: false, reason: 'sin correo de reportes configurado', month };
  const res = await sendMonthlyReport(db, mailer, month);
  return { sent: true, month, ...res };
}
