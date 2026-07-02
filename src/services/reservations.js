import crypto from 'node:crypto';
import { ROOM, OCCUPYING_STATUSES, CANCEL_MIN_BUSINESS_DAYS } from '../config.js';
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from '../errors.js';
import { computeBlocks, computeCost, isBlockOccupied } from './availability.js';
import { getHolidaySet, businessDaysBetween, todayISO } from './holidays.js';

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

// --- Administración: listado y transiciones de estado ------------------------

const VALID_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled'];

export function listReservations(db, { status } = {}) {
  if (status) {
    if (!VALID_STATUSES.includes(status)) throw new ValidationError('Estado inválido.');
    return db.prepare('SELECT * FROM reservations WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all();
}

export function countByStatus(db) {
  const rows = db.prepare('SELECT status, COUNT(*) AS n FROM reservations GROUP BY status').all();
  const counts = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 };
  for (const r of rows) counts[r.status] = r.n;
  return counts;
}

function requireReservation(db, id) {
  const r = getById(db, id);
  if (!r) throw new NotFoundError('Reserva no encontrada.');
  return r;
}

function freeBlocks(db, reservationId) {
  db.prepare('DELETE FROM blocks WHERE reservation_id = ?').run(reservationId);
}

export function auditLog(db, adminId, action, entity, entityId, detail = null) {
  db.prepare(
    'INSERT INTO audit_log (admin_id, action, entity, entity_id, detail, created_at) VALUES (?,?,?,?,?,?)',
  ).run(adminId ?? null, action, entity, entityId ?? null, detail, new Date().toISOString());
}

// Confirma una pre-reserva pendiente. Los bloques ya estaban reservados desde
// la creación, así que solo cambia el estado.
export function confirmReservation(db, id, adminId) {
  const r = requireReservation(db, id);
  if (r.status !== 'pending') {
    throw new ValidationError(`Solo se puede confirmar una reserva pendiente (estado actual: ${r.status}).`);
  }
  db.prepare('UPDATE reservations SET status=?, decided_by=?, decided_at=? WHERE id=?')
    .run('confirmed', adminId, new Date().toISOString(), id);
  auditLog(db, adminId, 'confirm', 'reservation', id);
  return getById(db, id);
}

// Rechaza una pre-reserva pendiente y libera el calendario.
export function rejectReservation(db, id, adminId, reason) {
  const r = requireReservation(db, id);
  if (r.status !== 'pending') {
    throw new ValidationError(`Solo se puede rechazar una reserva pendiente (estado actual: ${r.status}).`);
  }
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE reservations SET status=?, rejected_reason=?, decided_by=?, decided_at=? WHERE id=?')
      .run('rejected', reason ? String(reason).trim() : null, adminId, new Date().toISOString(), id);
    freeBlocks(db, id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  auditLog(db, adminId, 'reject', 'reservation', id, reason ? String(reason).trim() : null);
  return getById(db, id);
}

// Evalúa si una reserva puede cancelarse por autoservicio (regla ≥ N días hábiles).
export function cancelEligibility(db, r, today = todayISO()) {
  if (!OCCUPYING_STATUSES.includes(r.status)) {
    return { cancelable: false, business_days: 0, min_required: CANCEL_MIN_BUSINESS_DAYS, status: r.status };
  }
  const days = businessDaysBetween(today, r.start_date, getHolidaySet(db));
  return {
    cancelable: days >= CANCEL_MIN_BUSINESS_DAYS,
    business_days: days,
    min_required: CANCEL_MIN_BUSINESS_DAYS,
    status: r.status,
  };
}

// Cancelación autoservicio del solicitante (por token), con la regla de 1 semana.
export function selfCancelByToken(db, token, today = todayISO()) {
  const r = getByToken(db, token);
  if (!r) throw new NotFoundError('Reserva no encontrada.');
  if (!OCCUPYING_STATUSES.includes(r.status)) {
    throw new ValidationError(`Esta reserva no se puede cancelar (estado actual: ${r.status}).`);
  }
  const { cancelable, business_days } = cancelEligibility(db, r, today);
  if (!cancelable) {
    throw new ForbiddenError(
      `La cancelación en línea requiere al menos ${CANCEL_MIN_BUSINESS_DAYS} días hábiles de anticipación ` +
        `(disponibles: ${business_days}). Contacta al administrador para cancelar.`,
    );
  }
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE reservations SET status=?, rejected_reason=?, decided_at=? WHERE id=?')
      .run('cancelled', 'Cancelación autoservicio', new Date().toISOString(), r.id);
    freeBlocks(db, r.id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  auditLog(db, null, 'self_cancel', 'reservation', r.id);
  return getById(db, r.id);
}

// Cancela una reserva activa (pendiente o confirmada) y libera el calendario.
export function cancelReservation(db, id, adminId, reason) {
  const r = requireReservation(db, id);
  if (!OCCUPYING_STATUSES.includes(r.status)) {
    throw new ValidationError(`No se puede cancelar una reserva en estado "${r.status}".`);
  }
  db.exec('BEGIN');
  try {
    db.prepare('UPDATE reservations SET status=?, rejected_reason=?, decided_by=?, decided_at=? WHERE id=?')
      .run('cancelled', reason ? String(reason).trim() : null, adminId, new Date().toISOString(), id);
    freeBlocks(db, id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  auditLog(db, adminId, 'cancel', 'reservation', id, reason ? String(reason).trim() : null);
  return getById(db, id);
}
