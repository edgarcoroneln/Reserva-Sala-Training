import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOM, SLOTS, SLOT_TIMES, PRICE_HALF_USD, PRICE_DAY_USD } from './config.js';
import { getOccupiedBlocks } from './services/availability.js';
import {
  createReservation,
  getByToken,
  listReservations,
  countByStatus,
  confirmReservation,
  rejectReservation,
  cancelReservation,
} from './services/reservations.js';
import { authenticate, createSession, deleteSession } from './services/admins.js';
import { requireAdmin, setSessionCookie, clearSessionCookie } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Campos internos que no exponemos al cliente.
function publicView(r) {
  if (!r) return r;
  const { id, ...rest } = r;
  return rest;
}

export function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Info de la sala y parámetros (tarifas, turnos) para el frontend.
  app.get('/api/room', (_req, res) => {
    res.json({
      room: ROOM,
      slots: SLOTS,
      slot_times: SLOT_TIMES,
      price_half_usd: PRICE_HALF_USD,
      price_day_usd: PRICE_DAY_USD,
    });
  });

  // Disponibilidad: bloques ocupados en un rango (para pintar el calendario).
  app.get('/api/availability', (req, res, next) => {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return res.status(400).json({ error: 'Parámetros "from" y "to" requeridos (YYYY-MM-DD).' });
      }
      const occupied = getOccupiedBlocks(db, String(from), String(to));
      res.json({ room_id: ROOM.id, from, to, occupied });
    } catch (err) {
      next(err);
    }
  });

  // Crear pre-reserva.
  app.post('/api/reservations', (req, res, next) => {
    try {
      const reservation = createReservation(db, req.body ?? {});
      res.status(201).json({
        reservation: publicView(reservation),
        track_url: `/api/reservations/${reservation.token}`,
      });
    } catch (err) {
      next(err);
    }
  });

  // Consultar una reserva por su token (seguimiento del solicitante).
  app.get('/api/reservations/:token', (req, res, next) => {
    try {
      const reservation = getByToken(db, req.params.token);
      if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada.' });
      res.json({ reservation: publicView(reservation) });
    } catch (err) {
      next(err);
    }
  });

  // --- Módulo de administración ---------------------------------------------

  const admin = requireAdmin(db);

  // Login: valida credenciales, crea sesión y setea cookie httpOnly.
  app.post('/api/admin/login', (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};
      const found = authenticate(db, username, password);
      const token = createSession(db, found.id);
      setSessionCookie(res, token);
      res.json({ admin: { username: found.username } });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/admin/logout', admin, (req, res) => {
    deleteSession(db, req.sessionToken);
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/admin/me', admin, (req, res) => {
    res.json({ admin: { username: req.admin.username } });
  });

  // Listado (con filtro opcional por estado) + conteos para el tablero.
  app.get('/api/admin/reservations', admin, (req, res, next) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json({ counts: countByStatus(db), reservations: listReservations(db, { status }) });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/admin/reservations/:id/confirm', admin, (req, res, next) => {
    try {
      res.json({ reservation: confirmReservation(db, Number(req.params.id), req.admin.id) });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/admin/reservations/:id/reject', admin, (req, res, next) => {
    try {
      const reason = req.body?.reason;
      res.json({ reservation: rejectReservation(db, Number(req.params.id), req.admin.id, reason) });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/admin/reservations/:id/cancel', admin, (req, res, next) => {
    try {
      const reason = req.body?.reason;
      res.json({ reservation: cancelReservation(db, Number(req.params.id), req.admin.id, reason) });
    } catch (err) {
      next(err);
    }
  });

  // Manejador de errores centralizado.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    const body = { error: err.message || 'Error interno del servidor.' };
    if (err.conflicts) body.conflicts = err.conflicts;
    if (status >= 500) console.error(err);
    res.status(status).json(body);
  });

  return app;
}
