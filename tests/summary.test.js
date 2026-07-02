import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createReservation, confirmReservation } from '../src/services/reservations.js';
import { monthsInRange, reportSummary, reservationsXlsx, monthlyXlsx } from '../src/services/reports.js';

const ext = (o) => ({
  event_name: 'E', contact_email: 'a@b.com', duration_type: 'complete', rental_type: 'external',
  are: '1', org_id: '2', gl_account: '3', cost_center: '4', ...o,
});

test('monthsInRange lista los meses inclusive', () => {
  assert.deepEqual(monthsInRange('2026-05-10', '2026-07-02'), ['2026-05', '2026-06', '2026-07']);
  assert.deepEqual(monthsInRange('2026-03-01', '2026-03-31'), ['2026-03']);
});

test('reportSummary agrega bloques, utilización, ingresos y estados', () => {
  const db = createDb(':memory:');
  // Confirmada External de día completo (2 bloques, 300 USD) el 2026-07-06 (lunes)
  const r1 = createReservation(db, ext({ start_date: '2026-07-06', end_date: '2026-07-06' }));
  confirmReservation(db, r1.id, 1);
  // Interna media mañana (1 bloque) el 2026-07-07, queda pendiente
  createReservation(db, {
    event_name: 'I', contact_email: 'c@d.com', start_date: '2026-07-07', end_date: '2026-07-07',
    duration_type: 'half', half_block: 'AM', rental_type: 'internal',
  });

  const s = reportSummary(db, '2026-07-01', '2026-07-31');
  assert.equal(s.totals.blocksUsed, 3); // 2 + 1
  assert.equal(s.totals.revenue, 300);
  assert.equal(s.byStatus.confirmed, 1);
  assert.equal(s.byStatus.pending, 1);
  assert.equal(s.byMonth.length, 1);
  assert.ok(s.byMonth[0].capacity >= s.totals.blocksUsed); // capacidad ≥ usado
  assert.ok(s.totals.utilization > 0 && s.totals.utilization <= 100);
});

test('reservationsXlsx y monthlyXlsx generan un archivo .xlsx válido (firma ZIP)', async () => {
  const db = createDb(':memory:');
  const r = createReservation(db, ext({ start_date: '2026-07-06', end_date: '2026-07-06' }));
  confirmReservation(db, r.id, 1);

  const a = await reservationsXlsx(db, {});
  const b = await monthlyXlsx(db, '2026-07');
  // Un .xlsx es un ZIP: empieza con 'PK' (0x50 0x4B).
  assert.ok(Buffer.isBuffer(a) && a[0] === 0x50 && a[1] === 0x4b);
  assert.ok(Buffer.isBuffer(b) && b[0] === 0x50 && b[1] === 0x4b);
  assert.ok(b.length > 1000);
});
