// Mailer con transporte intercambiable:
//   - 'console' (por defecto): registra el correo en la tabla `emails` (outbox)
//     y lo imprime en consola. Permite probar TODO localmente sin credenciales.
//   - 'graph': además lo envía por Microsoft Graph desde el buzón institucional.
//
// Se selecciona con MAIL_TRANSPORT=console|graph.

export function createMailer(db, { transport = process.env.MAIL_TRANSPORT || 'console' } = {}) {
  async function send({ to, subject, body, template = null, reservationId = null, attachments = [] }) {
    if (!to) {
      // Sin destinatario (p. ej. correo de aviso al admin no configurado): se omite.
      return { skipped: true };
    }
    const names = JSON.stringify(attachments.map((a) => a.filename));
    let status = 'logged';
    let error = null;

    if (transport === 'graph') {
      try {
        await sendViaGraph({ to, subject, body, attachments });
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

    return { status, error };
  }

  return { send, transport };
}

// --- Microsoft Graph (client credentials) ------------------------------------
// Requiere: GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_SENDER.

async function graphToken() {
  const tenant = process.env.GRAPH_TENANT_ID;
  const params = new URLSearchParams({
    client_id: process.env.GRAPH_CLIENT_ID,
    client_secret: process.env.GRAPH_CLIENT_SECRET,
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

async function sendViaGraph({ to, subject, body, attachments }) {
  const sender = process.env.GRAPH_SENDER;
  const token = await graphToken();
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
