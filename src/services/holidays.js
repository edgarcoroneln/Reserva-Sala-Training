import { CANCEL_MIN_BUSINESS_DAYS } from '../config.js';

// Festivos oficiales (días de descanso obligatorio, LFT) de México.
// Catálogo inicial 2026–2027; en el futuro será administrable (Épica 7 del PRD).
export const DEFAULT_HOLIDAYS = [
  ['2026-01-01', 'Año Nuevo'],
  ['2026-02-02', 'Día de la Constitución'],
  ['2026-03-16', 'Natalicio de Benito Juárez'],
  ['2026-05-01', 'Día del Trabajo'],
  ['2026-09-16', 'Independencia de México'],
  ['2026-11-16', 'Revolución Mexicana'],
  ['2026-12-25', 'Navidad'],
  ['2027-01-01', 'Año Nuevo'],
];

export function seedHolidays(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM holidays').get().n;
  if (count > 0) return;
  const ins = db.prepare('INSERT INTO holidays (date, description) VALUES (?, ?)');
  for (const [date, description] of DEFAULT_HOLIDAYS) ins.run(date, description);
}

export function getHolidaySet(db) {
  const rows = db.prepare('SELECT date FROM holidays').all();
  return new Set(rows.map((r) => r.date));
}

// Cuenta días hábiles en el intervalo [from, to): desde `from` inclusive hasta
// `to` exclusive, excluyendo sábados, domingos y festivos. Con from = HOY y
// to = fecha de inicio, "1 semana" (lun→lun) da exactamente 5 días hábiles.
export function businessDaysBetween(from, to, holidaySet = new Set()) {
  if (!from || !to || to <= from) return 0;
  let count = 0;
  const cur = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cur < end) {
    const iso = cur.toISOString().slice(0, 10);
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) count += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

// Días hábiles en el rango [from, to] con AMBOS extremos incluidos (para capacidad).
export function businessDaysInclusive(from, to, holidaySet = new Set()) {
  if (!from || !to || to < from) return 0;
  const d = new Date(`${to}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return businessDaysBetween(from, d.toISOString().slice(0, 10), holidaySet);
}

// ¿Se puede cancelar por autoservicio? Requiere ≥ N días hábiles de anticipación.
export function canSelfCancel(startDate, today, holidaySet, minDays = CANCEL_MIN_BUSINESS_DAYS) {
  return businessDaysBetween(today, startDate, holidaySet) >= minDays;
}

// Fecha de "hoy" en formato YYYY-MM-DD (UTC).
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
