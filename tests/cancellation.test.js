import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { businessDaysBetween, canSelfCancel } from '../src/services/holidays.js';
import { createReservation, selfCancelByToken, cancelEligibility } from '../src/services/reservations.js';
import { getOccupiedBlocks } from '../src/services/availability.js';

function res(db, o = {}) {
  return createReservation(db, {
    event_name: 'Evento', contact_email: 'a@b.com',
    start_date: '2024-07-01', end_date: '2024-07-01',
    duration_type: 'complete', rental_type: 'internal', ...o,
  });
}

test('businessDaysBetween cuenta lunes a viernes (extremo derecho exclusivo)', () => {
  const s = new Set();
  assert.equal(businessDaysBetween('2024-06-03', '2024-06-10', s), 5); // lun→lun = 5 hábiles
  assert.equal(businessDaysBetween('2024-06-03', '2024-06-06', s), 3);
  assert.equal(businessDaysBetween('2024-06-03', '2024-06-03', s), 0);
  assert.equal(businessDaysBetween('2024-06-10', '2024-06-03', s), 0); // rango invertido
});

test('un festivo reduce el conteo de días hábiles', () => {
  assert.equal(businessDaysBetween('2024-06-03', '2024-06-10', new Set(['2024-06-05'])), 4);
});

test('canSelfCancel exige al menos 5 días hábiles', () => {
  const s = new Set();
  assert.equal(canSelfCancel('2024-06-10', '2024-06-03', s), true);
  assert.equal(canSelfCancel('2024-06-06', '2024-06-03', s), false);
});

test('self-cancel elegible cancela y libera el calendario', () => {
  const db = createDb(':memory:');
  const r = res(db);
  const out = selfCancelByToken(db, r.token, '2024-06-01');
  assert.equal(out.status, 'cancelled');
  assert.equal(getOccupiedBlocks(db, '2024-07-01', '2024-07-01').length, 0);
});

test('self-cancel demasiado próximo responde 403', () => {
  const db = createDb(':memory:');
  const r = res(db, { start_date: '2024-06-04', end_date: '2024-06-04' });
  assert.throws(() => selfCancelByToken(db, r.token, '2024-06-03'), (e) => e.status === 403);
});

test('self-cancel de una reserva ya cancelada responde 400', () => {
  const db = createDb(':memory:');
  const r = res(db);
  selfCancelByToken(db, r.token, '2024-06-01');
  assert.throws(() => selfCancelByToken(db, r.token, '2024-06-01'), (e) => e.status === 400);
});

test('cancelEligibility informa días hábiles disponibles', () => {
  const db = createDb(':memory:');
  const r = res(db, { start_date: '2024-06-10', end_date: '2024-06-10' });
  const e = cancelEligibility(db, r, '2024-06-03');
  assert.equal(e.business_days, 5);
  assert.equal(e.cancelable, true);
  assert.equal(e.min_required, 5);
});
