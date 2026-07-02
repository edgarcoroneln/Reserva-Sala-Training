import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

// Levanta la app en un puerto efímero con BD en memoria y prueba el ciclo por HTTP.
async function withServer(run) {
  const db = createDb(':memory:');
  const app = createApp(db);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    await run(base);
  } finally {
    server.close();
  }
}

const payload = {
  event_name: 'Taller Teamcenter',
  contact_email: 'luis@example.com',
  start_date: '2026-08-10',
  end_date: '2026-08-10',
  duration_type: 'complete',
  rental_type: 'external',
  are: 'ARE-7', org_id: 'ORG-2', gl_account: 'GL-1', cost_center: 'CC-4',
};

test('POST crea (201), refleja ocupación y bloquea solapamiento (409)', async () => {
  await withServer(async (base) => {
    // Crear
    let res = await fetch(`${base}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.reservation.status, 'pending');
    assert.equal(created.reservation.cost_usd, 300);
    const token = created.reservation.token;

    // Disponibilidad refleja los 2 bloques ocupados
    res = await fetch(`${base}/api/availability?from=2026-08-10&to=2026-08-10`);
    const avail = await res.json();
    assert.equal(avail.occupied.length, 2);

    // Solapamiento -> 409
    res = await fetch(`${base}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, contact_email: 'otra@example.com' }),
    });
    assert.equal(res.status, 409);

    // Consulta por token
    res = await fetch(`${base}/api/reservations/${token}`);
    assert.equal(res.status, 200);
    const looked = await res.json();
    assert.equal(looked.reservation.event_name, 'Taller Teamcenter');
  });
});

test('POST con datos inválidos responde 400', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: '', contact_email: 'x@y.z' }),
    });
    assert.equal(res.status, 400);
  });
});

test('GET token inexistente responde 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/reservations/no-existe`);
    assert.equal(res.status, 404);
  });
});
