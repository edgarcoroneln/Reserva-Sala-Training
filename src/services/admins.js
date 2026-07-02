import crypto from 'node:crypto';
import { AuthError } from '../errors.js';

const KEYLEN = 64;
const SESSION_HOURS = 8;

// --- Hash de contraseñas (scrypt, sin dependencias nativas) ------------------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

// --- Autenticación y sesiones ------------------------------------------------

export function authenticate(db, username, password) {
  const admin = db
    .prepare('SELECT * FROM admins WHERE username = ? AND active = 1')
    .get(String(username || '').trim());
  if (!admin || !verifyPassword(password || '', admin.password_hash)) {
    throw new AuthError('Usuario o contraseña incorrectos.');
  }
  return admin;
}

export function createSession(db, adminId, hours = SESSION_HOURS) {
  const token = crypto.randomBytes(24).toString('hex');
  const now = new Date();
  const expires = new Date(now.getTime() + hours * 3600 * 1000);
  db.prepare('INSERT INTO sessions (token, admin_id, created_at, expires_at) VALUES (?,?,?,?)')
    .run(token, adminId, now.toISOString(), expires.toISOString());
  return token;
}

// Devuelve { admin_id, username, expires_at } si la sesión existe y no expiró.
export function getSession(db, token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT s.admin_id, s.expires_at, a.username
         FROM sessions s JOIN admins a ON a.id = s.admin_id
        WHERE s.token = ? AND a.active = 1`,
    )
    .get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    deleteSession(db, token);
    return null;
  }
  return row;
}

export function deleteSession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// Siembra un administrador por defecto si no existe ninguno.
// Credenciales desde env (ADMIN_USER / ADMIN_PASSWORD) o valores por defecto.
export function seedDefaultAdmin(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;
  if (count > 0) return null;
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  db.prepare('INSERT INTO admins (username, password_hash, active, created_at) VALUES (?,?,1,?)')
    .run(username, hashPassword(password), new Date().toISOString());
  return { username, usingDefaultPassword: !process.env.ADMIN_PASSWORD };
}
