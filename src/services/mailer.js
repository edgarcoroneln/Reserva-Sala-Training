// Mailer con transporte intercambiable, configurable EN VIVO desde `settings`:
//   - 'console' (por defecto): registra el correo en la tabla `emails` (outbox)
//     y lo imprime en consola. Permite probar TODO localmente sin credenciales.
//   - 'graph': además lo envía por Microsoft Graph desde el buzón institucional.
//
// El transporte y el remitente se leen en cada envío desde la configuración
// (tabla `settings`, con respaldo en variables de entorno), así los cambios
// hechos en el módulo de administración aplican sin reiniciar el servidor.

import {
  getMailTransport, getMailSender, getGraphTenantId, getGraphClientId, getGraphClientSecret,
} from './settings.js';

export function createMailer(db) {
  async function send({ to, subject, body, template = null, reservationId = null, attachments = [] }) {
    if (!to) return { skipped: true };

    const transport = getMailTransport(db);
    const names = JSON.stringify(attachments.map((a) => a.filename));
    let status = 'logged';
    let error = null;

    if (transport === 'graph') {
      try {
        await sendViaGraph(db, { to, subject, body, attachments });
        status = 'sent';
      } catch (err) {
        status = 'error';
        error = String(err.message || err);
        console.error('[mailer] fallo Graph:', error);
      }
    } else {
      console.log(`[mailer:console] Para: ${to} | Asunto: ${subject}`);
    }

    db.prepare(
      `INSERT INTO emails (to_addr, subject, body, template, reservation_id, attachments, status, error, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(to, subject, body, template, reservationId, names, status, error, new Date().toISOString());

    return { status, error, transport };
  }

  return {
    send,
    get transport() { return getMailTransport(db); },
  };
}

// --- Microsoft Graph (client credentials) ------------------------------------

async function graphToken(tenant, clientId, clientSecret) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) throw new Error(`token Graph ${res.status}`);
  return (await res.json()).access_token;
}

async function sendViaGraph(db, { to, subject, body, attachments }) {
  const sender = getMailSender(db);
  const tenant = getGraphTenantId(db);
  const clientId = getGraphClientId(db);
  const clientSecret = getGraphClientSecret();

  // Guarda: sin credenciales completas no intentamos llamar a la red.
  if (!sender || !tenant || !clientId || !clientSecret) {
    throw new Error('Faltan credenciales de Microsoft Graph: define remitente, Tenant ID, Client ID y GRAPH_CLIENT_SECRET (.env).');
  }

  const token = await graphToken(tenant, clientId, clientSecret);
  const message = {
    subject,
    body: { contentType: 'HTML', content: body },
    toRecipients: [{ emailAddress: { address: to } }],
    attachments: attachments.map((a) => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: a.filename,
      contentBytes: Buffer.from(a.content).toString('base64'),
    })),
  };
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${sender}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });
  if (!res.ok) throw new Error(`sendMail Graph ${res.status}`);
}
