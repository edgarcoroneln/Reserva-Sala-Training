// Genera datos de DEMO para visualizar el tablero de utilización y los reportes.
// Uso:  npm run seed:demo        (usa DB_PATH o ./data/reservas.db)
// Ojo:  reinicia las reservas/bloques/correos existentes para dejar la demo limpia.

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createDb } from '../src/db.js';
import { createReservation, confirmReservation, rejectReservation, cancelReservation } from '../src/services/reservations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'reservas.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = createDb(dbPath);

// Reinicia datos transaccionales (no toca admins ni settings salvo el marcador de reporte).
db.exec('DELETE FROM blocks; DELETE FROM reservations; DELETE FROM emails; DELETE FROM audit_log;');
db.prepare("DELETE FROM settings WHERE key = 'report_last_sent_month'").run();

const adminId = db.prepare('SELECT id FROM admins LIMIT 1').get()?.id ?? 1;

const EVENTS = [
  'Curso NX CAD', 'Taller Teamcenter', 'Entrenamiento Simcenter', 'Onboarding DISW',
  'Workshop Tecnomatix', 'Capacitación Solid Edge', 'Sesión Polarion', 'Bootcamp PLM',
  'Demo cliente', 'Certificación NX CAM',
];
const INT_EMAILS = ['ana@disw.com', 'luis@disw.com', 'sofia@disw.com', 'diego@disw.com'];
const EXT_EMAILS = ['contacto@clientea.com', 'pm@empresab.com', 'ops@empresac.com'];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const iso = (d) => d.toISOString().slice(0, 10);

const today = new Date();
const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 4, 1));
const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0)); // fin del mes +1

let created = 0;
const counts = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 };

for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) continue; // solo días hábiles
  if (chance(0.45)) continue; // no todos los días tienen reserva

  const date = iso(d);
  const isExternal = chance(0.4);
  const roll = Math.random();
  const duration = roll < 0.5 ? 'complete' : 'half';
  const half_block = duration === 'half' ? (chance(0.5) ? 'AM' : 'PM') : null;

  const payload = {
    event_name: rnd(EVENTS),
    contact_email: isExternal ? rnd(EXT_EMAILS) : rnd(INT_EMAILS),
    start_date: date,
    end_date: date,
    duration_type: duration,
    rental_type: isExternal ? 'external' : 'internal',
    notes: '',
  };
  if (half_block) payload.half_block = half_block;
  if (isExternal) Object.assign(payload, { are: 'ARE-' + (100 + created), org_id: 'ORG-' + rnd([1, 2, 3]), gl_account: 'GL-' + rnd([500, 600, 700]), cost_center: 'CC-' + rnd([10, 20, 30]) });

  let r;
  try {
    r = createReservation(db, payload);
  } catch {
    continue; // conflicto de bloque: saltar
  }
  created += 1;

  const inFuture = date > iso(today);
  if (inFuture) {
    // Futuro: mayormente pendiente, algunas confirmadas
    if (chance(0.55)) { confirmReservation(db, r.id, adminId); counts.confirmed += 1; }
    else counts.pending += 1;
  } else {
    // Pasado: mayormente confirmadas, algunas rechazadas/canceladas
    const s = Math.random();
    if (s < 0.75) { confirmReservation(db, r.id, adminId); counts.confirmed += 1; }
    else if (s < 0.88) { rejectReservation(db, r.id, adminId, 'Choque de agenda'); counts.rejected += 1; }
    else { confirmReservation(db, r.id, adminId); cancelReservation(db, r.id, adminId, 'Cancelada por el área'); counts.cancelled += 1; counts.confirmed -= 1; }
  }
}

console.log(`Demo generada en ${dbPath}`);
console.log(`Reservas creadas: ${created}`);
console.log('Por estado:', counts);
console.log(`Periodo: ${iso(start)} a ${iso(end)}`);
console.log('Abre http://localhost:3000/admin.html (admin / admin123) → "Utilización de la sala".');
