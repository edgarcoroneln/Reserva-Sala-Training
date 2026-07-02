import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createReservation, getByToken } from '../src/services/reservations.js';
import { getOccupiedBlocks } from '../src/services/availability.js';

function base(overrides = {}) {
  return {
    event_name: 'Curso NX',
    contact_email: 'ana@example.com',
    start_date: '2026-07-02',
    end_date: '2026-07-02',
    duration_type: 'complete',
    rental_type: 'internal',
    ...overrides,
  };
}

test('crea una pre-reserva en estado pending con su token', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, base());
  assert.equal(r.status, 'pending');
  assert.equal(r.total_days, 1);
  assert.equal(r.cost_usd, 0); // internal
  assert.match(r.token, /^[a-f0-9]{48}$/);
  assert.ok(getByToken(db, r.token));
});

test('External calcula costo y guarda datos ARE', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, base({
    rental_type: 'external',
    are: 'ARE-1', org_id: 'ORG-9', gl_account: 'GL-5', cost_center: 'CC-3',
  }));
  assert.equal(r.cost_usd, 300); // día completo = 2 bloques × 150
  assert.equal(r.are, 'ARE-1');
  assert.equal(r.cost_center, 'CC-3');
});

test('Internal ignora datos ARE aunque se envíen', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, base({ are: 'NO-DEBE', org_id: 'NO' }));
  assert.equal(r.are, null);
  assert.equal(r.org_id, null);
});

test('rechaza solapamiento en el mismo bloque (409)', () => {
  const db = createDb(':memory:');
  createReservation(db, base());
  assert.throws(() => createReservation(db, base({ contact_email: 'otro@example.com' })), (err) => {
    assert.equal(err.status, 409);
    return true;
  });
});

test('permite compartir un día en turnos distintos (AM vs PM)', () => {
  const db = createDb(':memory:');
  createReservation(db, base({ duration_type: 'half', half_block: 'AM' }));
  const pm = createReservation(db, base({ duration_type: 'half', half_block: 'PM', contact_email: 'pm@example.com' }));
  assert.equal(pm.status, 'pending');
  const occ = getOccupiedBlocks(db, '2026-07-02', '2026-07-02');
  assert.equal(occ.length, 2); // AM y PM ocupados por reservas distintas
});

test('medio día PM no colisiona con otra reserva PM distinta pero sí consigo misma', () => {
  const db = createDb(':memory:');
  createReservation(db, base({ duration_type: 'half', half_block: 'PM' }));
  assert.throws(
    () => createReservation(db, base({ duration_type: 'half', half_block: 'PM' })),
    (err) => err.status === 409,
  );
});

test('valida correo inválido', () => {
  const db = createDb(':memory:');
  assert.throws(() => createReservation(db, base({ contact_email: 'no-es-correo' })), /correo/i);
});
