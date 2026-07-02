import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createMailer } from '../src/services/mailer.js';
import { setSetting } from '../src/services/settings.js';
import { createReservation, confirmReservation } from '../src/services/reservations.js';
import {
  toCsv, monthRange, previousMonth, monthlyBillable, sendMonthlyReport, maybeRunMonthlyReport,
} from '../src/services/reports.js';

const external = (o) => ({
  event_name: 'E', contact_email: 'a@b.com', duration_type: 'complete', rental_type: 'external',
  are: '1', org_id: '2', gl_account: '3', cost_center: '4', ...o,
});

test('toCsv incluye encabezados y escapa comas', () => {
  const csv = toCsv([{ event_name: 'A,B', cost_usd: 300 }], ['event_name', 'cost_usd']);
  assert.match(csv, /^event_name,cost_usd/);
  assert.match(csv, /"A,B",300/);
});

test('monthRange y previousMonth', () => {
  assert.deepEqual(monthRange('2026-12'), ['2026-12-01', '2027-01-01']);
  assert.equal(previousMonth(new Date('2026-08-15T00:00:00Z')), '2026-07');
  assert.equal(previousMonth(new Date('2026-01-10T00:00:00Z')), '2025-12');
});

test('monthlyBillable: solo External confirmadas del mes', () => {
  const db = createDb(':memory:');
  const ext = createReservation(db, external({ start_date: '2026-07-10', end_date: '2026-07-10' }));
  confirmReservation(db, ext.id, 1);
  const int = createReservation(db, {
    event_name: 'I', contact_email: 'c@d.com', start_date: '2026-07-11', end_date: '2026-07-11',
    duration_type: 'complete', rental_type: 'internal',
  });
  confirmReservation(db, int.id, 1);
  createReservation(db, external({ contact_email: 'e@f.com', start_date: '2026-07-12', end_date: '2026-07-12' })); // pendiente
  createReservation(db, external({ contact_email: 'g@h.com', start_date: '2026-08-01', end_date: '2026-08-01' })); // otro mes

  const rows = monthlyBillable(db, '2026-07');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].event_name, 'E');
});

test('sendMonthlyReport registra el correo (outbox) y adjunta CSV', async () => {
  const db = createDb(':memory:');
  const mailer = createMailer(db);
  const r = await sendMonthlyReport(db, mailer, '2026-07', 'finanzas@x.com');
  assert.equal(r.to, 'finanzas@x.com');
  const row = db.prepare("SELECT * FROM emails WHERE template='monthly_report'").get();
  assert.ok(row);
  assert.match(row.attachments, /reporte-2C-1-2026-07\.csv/);
});

test('maybeRunMonthlyReport envía una vez y no repite el mismo mes', async () => {
  const db = createDb(':memory:');
  setSetting(db, 'report_email', 'finanzas@x.com');
  const mailer = createMailer(db);
  const now = new Date('2026-08-03T00:00:00Z'); // mes anterior = 2026-07
  const a = await maybeRunMonthlyReport(db, mailer, now);
  assert.equal(a.sent, true);
  assert.equal(a.month, '2026-07');
  const b = await maybeRunMonthlyReport(db, mailer, now);
  assert.equal(b.sent, false);
});

test('maybeRunMonthlyReport no envía sin correo configurado', async () => {
  const db = createDb(':memory:');
  const mailer = createMailer(db);
  const r = await maybeRunMonthlyReport(db, mailer, new Date('2026-08-03T00:00:00Z'));
  assert.equal(r.sent, false);
});
