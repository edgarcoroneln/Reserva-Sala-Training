import { DatabaseSync } from 'node:sqlite';
import { ROOM } from './config.js';

// Crea (o abre) la base de datos SQLite, aplica el esquema y siembra la sala 2C-1.
// Usar ':memory:' para pruebas. En el futuro esta capa se sustituye por PostgreSQL
// sin tocar el resto de la app (ver System_Design.md).
export function createDb(path = ':memory:') {
  const db = new DatabaseSync(path);
  if (path !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  seed(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id     TEXT PRIMARY KEY,
      name   TEXT NOT NULL,
      site   TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id       TEXT NOT NULL REFERENCES rooms(id),
      event_name    TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      start_date    TEXT NOT NULL,           -- YYYY-MM-DD
      end_date      TEXT NOT NULL,           -- YYYY-MM-DD
      duration_type TEXT NOT NULL,           -- 'half' | 'complete'
      half_block    TEXT,                    -- 'AM' | 'PM' | NULL
      total_days    INTEGER NOT NULL,
      rental_type   TEXT NOT NULL,           -- 'internal' | 'external'
      notes         TEXT,
      are           TEXT,
      org_id        TEXT,
      gl_account    TEXT,
      cost_center   TEXT,
      cost_usd      INTEGER NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'pending',
      token         TEXT NOT NULL UNIQUE,
      created_at    TEXT NOT NULL
    );

    -- Un bloque = (sala, fecha, turno). La restricción UNIQUE es la garantía a
    -- nivel de BD contra la doble reserva (riesgo R06). Solo existen bloques de
    -- reservas activas: al cancelar/rechazar se eliminan (ON DELETE CASCADE).
    CREATE TABLE IF NOT EXISTS blocks (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id        TEXT NOT NULL REFERENCES rooms(id),
      date           TEXT NOT NULL,          -- YYYY-MM-DD
      slot           TEXT NOT NULL,          -- 'AM' | 'PM'
      reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
      UNIQUE (room_id, date, slot)
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_room_date ON blocks(room_id, date);
  `);
}

function seed(db) {
  const exists = db.prepare('SELECT 1 FROM rooms WHERE id = ?').get(ROOM.id);
  if (!exists) {
    db.prepare('INSERT INTO rooms (id, name, site) VALUES (?, ?, ?)')
      .run(ROOM.id, ROOM.name, ROOM.site);
  }
}
