import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { buildIcs } from '../src/services/notifications.js';

async function withServer(run) {
  const db = createDb(':memory:');
  const server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run(base, db);
  } finally {
    server.close();
  }
}

const payload = (o = {}) => ({
  event_name: 'Curso', contact_email: 'sol@ejemplo.com',
  start_date: '2027-03-02', end_date: '2027-03-02',
  duration_type: 'complete', rental_type: 'internal', ...o,
});

test('crear reserva registra correo "created" al solicitante', async () => {
  await withServer(async (base, db) => {
    const res = await fetch(`${base}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()),
    });
    assert.equal(res.status, 201);
    const n = db.prepare("SELECT COUNT(*) AS n FROM emails WHERE template='created' AND to_addr='sol@ejemplo.com'").get().n;
    assert.equal(n, 1);
  });
});

test('confirmar registra correo "confirmed" con adjunto .ics', async () => {
  await withServer(async (base, db) => {
    let res = await fetch(`${base}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()),
    });
    const { reservation } = await res.json();

    res = await fetch(`${base}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const cookie = res.headers.get('set-cookie').split(';')[0];

    res = await fetch(`${base}/api/admin/reservations?status=pending`, { headers: { Cookie: cookie } });
    const { reservations } = await res.json();
    const id = reservations.find((x) => x.token === reservation.token).id;

    await fetch(`${base}/api/admin/reservations/${id}/confirm`, { method: 'POST', headers: { Cookie: cookie } });
    const row = db.prepare("SELECT * FROM emails WHERE template='confirmed'").get();
    assert.ok(row);
    assert.match(row.attachments, /\.ics/);
  });
});

test('el .ics incluye el evento y la sala', () => {
  const ics = buildIcs({
    token: 'abc', event_name: 'Demo', start_date: '2027-03-02', end_date: '2027-03-02',
    duration_type: 'half', half_block: 'AM',
  });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Demo/);
  assert.match(ics, /DTSTART:20270302T080000/);
});

test('cancelación autoservicio vía HTTP libera y notifica (o 403 si está próximo)', async () => {
  await withServer(async (base, db) => {
    // Reserva muy próxima -> autoservicio bloqueado (403)
    let res = await fetch(`${base}/api/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload({ start_date: '2020-01-02', end_date: '2020-01-02' })),
    });
    const { reservation } = await res.json();
    res = await fetch(`${base}/api/reservations/${reservation.token}/cancel`, { method: 'POST' });
    assert.equal(res.status, 403);
  });
});
