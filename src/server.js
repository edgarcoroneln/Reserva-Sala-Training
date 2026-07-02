import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDb } from './db.js';
import { createMailer } from './services/mailer.js';
import { maybeRunMonthlyReport } from './services/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'reservas.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = createDb(dbPath);
const mailer = createMailer(db);
const app = createApp(db, { mailer });

// Reporte mensual automático: al arranque y cada 6 h revisa si falta enviar el
// reporte del mes anterior (solo lo envía una vez, si hay correo configurado).
async function runReportCheck() {
  try {
    const r = await maybeRunMonthlyReport(db, mailer);
    if (r.sent) console.log(`[reporte] enviado ${r.month} a ${r.to} (${r.count} reservas, ${r.total} USD)`);
  } catch (err) {
    console.error('[reporte]', err.message);
  }
}
runReportCheck();
setInterval(runReportCheck, 6 * 3600 * 1000).unref();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Reserva Sala 2C-1 — servidor en http://localhost:${PORT}`);
});
