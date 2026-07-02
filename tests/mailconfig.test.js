import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { createMailer } from '../src/services/mailer.js';
import { setSetting, getMailConfig } from '../src/services/settings.js';

async function withAdmin(run) {
  const db = createDb(':memory:');
  const server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(`${base}/api/admin/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  try {
    await run(base, cookie, db);
  } finally {
    server.close();
  }
}

test('getMailConfig no expone el secreto y refleja defaults', () => {
  const db = createDb(':memory:');
  const cfg = getMailConfig(db);
  assert.equal(cfg.mail_transport, 'console');
  assert.equal('graph_client_secret' in cfg, false);
  assert.equal(typeof cfg.has_graph_secret, 'boolean');
});

test('PUT settings guarda transporte y remitente; GET los devuelve', async () => {
  await withAdmin(async (base, cookie) => {
    let res = await fetch(`${base}/api/admin/settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mail_transport: 'graph', mail_sender: 'sala@dominio.com', report_email: 'fin@x.com' }),
    });
    assert.equal(res.status, 200);
    res = await fetch(`${base}/api/admin/settings`, { headers: { Cookie: cookie } });
    const cfg = await res.json();
    assert.equal(cfg.mail_transport, 'graph');
    assert.equal(cfg.mail_sender, 'sala@dominio.com');
    assert.equal(cfg.report_email, 'fin@x.com');
  });
});

test('correo de prueba en modo console responde status "logged"', async () => {
  await withAdmin(async (base, cookie, db) => {
    const res = await fetch(`${base}/api/admin/mail/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ to: 'prueba@x.com' }),
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'logged');
    const n = db.prepare("SELECT COUNT(*) AS n FROM emails WHERE template='test'").get().n;
    assert.equal(n, 1);
  });
});

test('correo de prueba sin destinatario responde 400', async () => {
  await withAdmin(async (base, cookie) => {
    const res = await fetch(`${base}/api/admin/mail/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
  });
});

test('transporte graph sin credenciales falla con mensaje claro (sin red)', async () => {
  const db = createDb(':memory:');
  setSetting(db, 'mail_transport', 'graph'); // sin sender/tenant/client/secret
  const mailer = createMailer(db);
  const result = await mailer.send({ to: 'x@y.com', subject: 'hola', body: 'test' });
  assert.equal(result.status, 'error');
  assert.match(result.error, /credenciales/i);
});
