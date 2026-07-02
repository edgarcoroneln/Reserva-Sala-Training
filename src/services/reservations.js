import crypto from 'node:crypto';
import { ROOM } from '../config.js';
import { ValidationError, ConflictError } from '../errors.js';
import { computeBlocks, computeCost, isBlockOccupied } from './availability.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function required(payload, field, label) {
  const v = payload[field];
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new ValidationError(`El campo "${label ?? field}" es obligatorio.`);
  }
  return String(v).trim();
}

function optional(payload, field) {
  const v = payload[field];
  return v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim();
}

// Crea una pre-reserva (estado 'pending'), reservando sus bloques de forma
// transaccional. Si algún bloque ya está ocupado, lanza ConflictError (409).
export function createReservation(db, payload) {
  const event_name = required(payload, 'event_name', 'Nombre del evento');
  const contact_email = required(payload, 'contact_email', 'Correo de contacto');
  if (!EMAIL_RE.test(contact_email)) throw new ValidationError('El correo de contacto no es válido.');

  const start_date = required(payload, 'start_date', 'Fecha de inicio');
  const end_date = required(payload, 'end_date', 'Fecha de fin');
  const duration_type = required(payload, 'duration_type', 'Duración');
  const rental_type = required(payload, 'rental_type', 'Tipo de renta');
  const half_block = optional(payload, 'half_block');

  // Bloques + costo (valida fechas, duración y tipo de renta).
  const blocks = computeBlocks({ start_date, end_date, duration_type, half_block });
  const total_days = new Set(blocks.map((b) => b.date)).size;
  const cost_usd = computeCost(blocks, rental_type);

  const isExternal = rental_type === 'external';
  const notes = optional(payload, 'notes');
  // Los datos ARE solo aplican a External (Internal = DISW no los captura).
  const are = isExternal ? optional(payload, 'are') : null;
  const org_id = isExternal ? optional(payload, 'org_id') : null;
  const gl_account = isExternal ? optional(payload, 'gl_account') : null;
  const cost_center = isExternal ? optional(payload, 'cost_center') : null;

  const token = crypto.randomBytes(24).toString('hex');
  const created_at = new Date().toISOString();

  // Chequeo previo para dar un mensaje de conflicto preciso...
  const conflicts = blocks.filter((b) => isBlockOccupied(db, b.date, b.slot));
  if (conflicts.length > 0) {
    throw new ConflictError('Uno o más bloques ya están ocupados en esas fechas.', conflicts);
  }

  // ...y la transacción + UNIQUE(room,date,slot) como red de seguridad ante concurrencia.
  db.exec('BEGIN');
  try {
    const info = db
      .prepare(
        `INSERT INTO reservations
          (room_id, event_name, contact_email, start_date, end_date, duration_type,
           half_block, total_days, rental_type, notes, are, org_id, gl_account,
           cost_center, cost_usd, status, token, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        ROOM.id, event_name, contact_email, start_date, end_date, duration_type,
        half_block, total_days, rental_type, notes, are, org_id, gl_account,
        cost_center, cost_usd, 'pending', token, created_at,
      );

    const reservationId = info.lastInsertRowid;
    const insBlock = db.prepare(
      'INSERT INTO blocks (room_id, date, slot, reservation_id) VALUES (?, ?, ?, ?)',
    );
    for (const b of blocks) insBlock.run(ROOM.id, b.date, b.slot, reservationId);

    db.exec('COMMIT');
    return getById(db, reservationId);
  } catch (err) {
    db.exec('ROLLBACK');
    if (String(err.message).includes('UNIQUE') && String(err.message).includes('blocks')) {
      throw new ConflictError('Uno o más bloques acaban de ser ocupados. Intenta de nuevo.', blocks);
    }
    throw err;
  }
}

export function getById(db, id) {
  return db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
}

export function getByToken(db, token) {
  return db.prepare('SELECT * FROM reservations WHERE token = ?').get(token);
}
