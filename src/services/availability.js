import { SLOTS, PRICE_HALF_USD, RENTAL_TYPES, DURATION_TYPES, ROOM } from '../config.js';
import { ValidationError } from '../errors.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Valida que sea una fecha real en formato YYYY-MM-DD.
export function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Lista de fechas (YYYY-MM-DD) entre start y end, ambas inclusive.
export function eachDate(start, end) {
  const dates = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

// Convierte los datos de duración en la lista concreta de bloques (fecha + turno)
// que la reserva ocupará. Es la pieza que decide la granularidad AM/PM.
export function computeBlocks({ start_date, end_date, duration_type, half_block }) {
  if (!isValidDate(start_date)) throw new ValidationError('La fecha de inicio es inválida (YYYY-MM-DD).');
  if (!isValidDate(end_date)) throw new ValidationError('La fecha de fin es inválida (YYYY-MM-DD).');
  if (end_date < start_date) throw new ValidationError('La fecha de fin no puede ser anterior a la de inicio.');
  if (!DURATION_TYPES.includes(duration_type)) throw new ValidationError('La duración debe ser "half" o "complete".');

  if (duration_type === 'half') {
    // En el MVP, medio día aplica solo a reservas de un solo día (ver PRD §5).
    if (start_date !== end_date) {
      throw new ValidationError('Un medio día aplica solo a reservas de un solo día.');
    }
    if (!SLOTS.includes(half_block)) {
      throw new ValidationError('Para medio día debes elegir el bloque AM o PM.');
    }
    return [{ date: start_date, slot: half_block }];
  }

  // Día completo: cada día del rango ocupa AM y PM.
  return eachDate(start_date, end_date).flatMap((date) => SLOTS.map((slot) => ({ date, slot })));
}

// Costo total en USD. Internal (DISW) no paga; External paga 150 por bloque.
export function computeCost(blocks, rental_type) {
  if (!RENTAL_TYPES.includes(rental_type)) throw new ValidationError('El tipo de renta debe ser "internal" o "external".');
  return rental_type === 'external' ? blocks.length * PRICE_HALF_USD : 0;
}

// Bloques ocupados de la sala dentro de un rango de fechas, para pintar el
// calendario de disponibilidad. Solo cuentan reservas activas (pending/confirmed).
export function getOccupiedBlocks(db, from, to) {
  if (!isValidDate(from) || !isValidDate(to)) {
    throw new ValidationError('Los parámetros "from" y "to" deben ser fechas YYYY-MM-DD.');
  }
  return db
    .prepare(
      `SELECT b.date, b.slot
         FROM blocks b
         JOIN reservations r ON r.id = b.reservation_id
        WHERE b.room_id = ?
          AND b.date >= ? AND b.date <= ?
          AND r.status IN ('pending', 'confirmed')
        ORDER BY b.date, b.slot`,
    )
    .all(ROOM.id, from, to);
}

// ¿Está ocupado un bloque puntual? (la tabla `blocks` solo guarda bloques activos).
export function isBlockOccupied(db, date, slot) {
  return !!db
    .prepare('SELECT 1 FROM blocks WHERE room_id = ? AND date = ? AND slot = ?')
    .get(ROOM.id, date, slot);
}
