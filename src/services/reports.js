import { ROOM } from '../config.js';
import { getReportEmail, getSetting, setSetting } from './settings.js';
import { getHolidaySet, businessDaysInclusive } from './holidays.js';
import { buildReservationsBuffer, buildMonthlyBuffer } from './excel.js';

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

// --- Exportables en Excel (.xlsx) --------------------------------------------

export async function reservationsXlsx(db, filter = {}) {
  return buildReservationsBuffer(reservationsForReport(db, filter));
}

export async function monthlyXlsx(db, month) {
  const rows = monthlyBillable(db, month);
  const [, next] = monthRange(month);
  const nd = new Date(`${next}T00:00:00Z`);
  nd.setUTCDate(nd.getUTCDate() - 1);
  const summary = reportSummary(db, `${month}-01`, nd.toISOString().slice(0, 10));
  return buildMonthlyBuffer({ month, rows, summary });
}

// Lista de meses 'YYYY-MM' entre from y to (por fecha), ambos inclusive.
export function monthsInRange(from, to) {
  const out = [];
  let [y, m] = from.slice(0, 7).split('-').map(Number);
  const [ey, em] = to.slice(0, 7).split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

// Sub-rango del mes `month` recortado a [from, to].
function clampMonth(month, from, to) {
  const [first, next] = monthRange(month);
  const nd = new Date(`${next}T00:00:00Z`);
  nd.setUTCDate(nd.getUTCDate() - 1);
  const last = nd.toISOString().slice(0, 10);
  return [from > first ? from : first, to < last ? to : last];
}

// Resumen agregado para el tablero de utilización (por periodo).
export function reportSummary(db, from, to) {
  const statusRows = db
    .prepare('SELECT status, COUNT(*) n FROM reservations WHERE start_date BETWEEN ? AND ? GROUP BY status')
    .all(from, to);
  const byStatus = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 };
  for (const r of statusRows) byStatus[r.status] = r.n;

  const blockRows = db
    .prepare(
      `SELECT substr(b.date,1,7) month, b.slot, COUNT(*) n
         FROM blocks b JOIN reservations r ON r.id = b.reservation_id
        WHERE r.status IN ('pending','confirmed') AND b.date BETWEEN ? AND ?
        GROUP BY month, b.slot`,
    )
    .all(from, to);

  const revRows = db
    .prepare(
      `SELECT substr(start_date,1,7) month, SUM(cost_usd) usd
         FROM reservations
        WHERE rental_type='external' AND status='confirmed' AND start_date BETWEEN ? AND ?
        GROUP BY month`,
    )
    .all(from, to);

  const typeRows = db
    .prepare(
      `SELECT rental_type, COUNT(*) n FROM reservations
        WHERE status='confirmed' AND start_date BETWEEN ? AND ? GROUP BY rental_type`,
    )
    .all(from, to);

  const holidays = getHolidaySet(db);
  const pick = (rows, month, slot) => rows.find((x) => x.month === month && (slot === undefined || x.slot === slot));

  const byMonth = monthsInRange(from, to).map((month) => {
    const am = pick(blockRows, month, 'AM')?.n || 0;
    const pm = pick(blockRows, month, 'PM')?.n || 0;
    const [ms, me] = clampMonth(month, from, to);
    const capacity = businessDaysInclusive(ms, me, holidays) * 2;
    const used = am + pm;
    const revenue = revRows.find((x) => x.month === month)?.usd || 0;
    return { month, am, pm, used, capacity, utilization: capacity ? Math.round((used / capacity) * 100) : 0, revenue };
  });

  const sum = (k) => byMonth.reduce((s, x) => s + x[k], 0);
  const totals = {
    blocksUsed: sum('used'), capacity: sum('capacity'), revenue: sum('revenue'),
    am: sum('am'), pm: sum('pm'), confirmed: byStatus.confirmed,
  };
  totals.utilization = totals.capacity ? Math.round((totals.blocksUsed / totals.capacity) * 100) : 0;

  const byType = {
    internal: typeRows.find((x) => x.rental_type === 'internal')?.n || 0,
    external: typeRows.find((x) => x.rental_type === 'external')?.n || 0,
  };

  return { from, to, byStatus, byMonth, totals, byType };
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
  const xlsx = await monthlyXlsx(db, month);
  const result = await mailer.send({
    to,
    subject: `Reporte de rentas Sala ${ROOM.id} — ${month}`,
    template: 'monthly_report',
    attachments: [{ filename: `reporte-${ROOM.id}-${month}.xlsx`, content: xlsx }],
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
