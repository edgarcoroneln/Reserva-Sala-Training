import { getSession } from '../services/admins.js';

export const SESSION_COOKIE = 'sid';

// Parseo mínimo de cookies desde el header (evita dependencias externas).
export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    out[k] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function setSessionCookie(res, token, maxAgeSeconds = 8 * 3600) {
  // Sin `Secure` para funcionar en http local; en producción (HTTPS) agrégalo.
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

// Middleware: exige una sesión de administrador válida.
export function requireAdmin(db) {
  return (req, res, next) => {
    const token = parseCookies(req)[SESSION_COOKIE];
    const session = getSession(db, token);
    if (!session) return res.status(401).json({ error: 'No autenticado.' });
    req.admin = { id: session.admin_id, username: session.username };
    req.sessionToken = token;
    next();
  };
}
