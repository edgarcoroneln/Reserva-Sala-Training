import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import {
  hashPassword, verifyPassword, authenticate, createSession, getSession, deleteSession,
} from '../src/services/admins.js';
import {
  createReservation, confirmReservation, rejectReservation, cancelReservation,
} from '../src/services/reservations.js';
import { getOccupiedBlocks } from '../src/services/availability.js';

function baseReservation(o = {}) {
  return {
    event_name: 'Reunión', contact_email: 'a@b.com',
    start_date: '2026-10-05', end_date: '2026-10-05',
    duration_type: 'complete', rental_type: 'internal', ...o,
  };
}

test('hash de contraseña: verifica la correcta y rechaza la incorrecta', () => {
  const h = hashPassword('secreta');
  assert.ok(verifyPassword('secreta', h));
  assert.equal(verifyPassword('otra', h), false);
});

test('admin por defecto sembrado: autentica admin/admin123, rechaza mala', () => {
  const db = createDb(':memory:');
  assert.equal(authenticate(db, 'admin', 'admin123').username, 'admin');
  assert.throws(() => authenticate(db, 'admin', 'mala'), (e) => e.status === 401);
});

test('sesiones: crear, obtener y borrar', () => {
  const db = createDb(':memory:');
  const a = authenticate(db, 'admin', 'admin123');
  const token = createSession(db, a.id);
  assert.equal(getSession(db, token).username, 'admin');
  deleteSession(db, token);
  assert.equal(getSession(db, token), null);
});

test('confirmar: pending -> confirmed y no se puede reconfirmar', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, baseReservation());
  assert.equal(confirmReservation(db, r.id, 1).status, 'confirmed');
  assert.throws(() => confirmReservation(db, r.id, 1), (e) => e.status === 400);
});

test('rechazar libera el calendario y guarda el motivo', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, baseReservation());
  assert.equal(getOccupiedBlocks(db, '2026-10-05', '2026-10-05').length, 2);
  const rej = rejectReservation(db, r.id, 1, 'No procede');
  assert.equal(rej.status, 'rejected');
  assert.equal(rej.rejected_reason, 'No procede');
  assert.equal(getOccupiedBlocks(db, '2026-10-05', '2026-10-05').length, 0);
});

test('cancelar una confirmada libera el calendario', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, baseReservation());
  confirmReservation(db, r.id, 1);
  assert.equal(cancelReservation(db, r.id, 1).status, 'cancelled');
  assert.equal(getOccupiedBlocks(db, '2026-10-05', '2026-10-05').length, 0);
});

test('tras rechazar, el bloque queda libre para una nueva reserva', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, baseReservation());
  rejectReservation(db, r.id, 1);
  const r2 = createReservation(db, baseReservation({ contact_email: 'c@d.com' }));
  assert.equal(r2.status, 'pending');
});

test('la acción de auditoría queda registrada', () => {
  const db = createDb(':memory:');
  const r = createReservation(db, baseReservation());
  confirmReservation(db, r.id, 1);
  const n = db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='confirm'").get().n;
  assert.equal(n, 1);
});

// --- HTTP: autenticación por cookie ------------------------------------------

async function withServer(run) {
  const server = createApp(createDb(':memory:')).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base);
  } finally {
    server.close();
  }
}

test('HTTP: rutas admin exigen sesión (401); login setea cookie y da acceso', async () => {
  await withServer(async (base) => {
    let res = await fetch(`${base}/api/admin/reservations`);
    assert.equal(res.status, 401);

    res = await fetch(`${base}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    assert.equal(res.status, 200);
    const cookie = res.headers.get('set-cookie').split(';')[0];

    res = await fetch(`${base}/api/admin/reservations`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    assert.ok((await res.json()).counts);
  });
});

test('HTTP: login con credenciales inválidas responde 401', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'no' }),
    });
    assert.equal(res.status, 401);
  });
});

test('HTTP: flujo completo confirmar por API con cookie', async () => {
  await withServer(async (base) => {
    // Crear una reserva por la API pública
    let res = await fetch(`${base}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseReservation({ start_date: '2026-11-02', end_date: '2026-11-02' })),
    });
    const { reservation } = await res.json();

    // Login
    res = await fetch(`${base}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const cookie = res.headers.get('set-cookie').split(';')[0];

    // Buscar el id vía listado (la API pública no expone id)
    res = await fetch(`${base}/api/admin/reservations?status=pending`, { headers: { Cookie: cookie } });
    const { reservations } = await res.json();
    const target = reservations.find((x) => x.token === reservation.token);
    assert.ok(target);

    // Confirmar
    res = await fetch(`${base}/api/admin/reservations/${target.id}/confirm`, {
      method: 'POST', headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).reservation.status, 'confirmed');
  });
});
