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
  cancelEligibility,
  selfCancelByToken,
} from './services/reservations.js';
import { authenticate, createSession, deleteSession } from './services/admins.js';
import { requireAdmin, setSessionCookie, clearSessionCookie } from './middleware/auth.js';
import { createMailer } from './services/mailer.js';
import * as notify from './services/notifications.js';
import { getReportEmail, getAdminNotifyEmail, setSetting } from './services/settings.js';
import {
  toCsv, reservationsForReport, monthlyBillable, sendMonthlyReport, previousMonth,
} from './services/reports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function publicView(r) {
  if (!r) return r;
  const { id, ...rest } = r;
  return rest;
}

export function createApp(db, { mailer = createMailer(db) } = {}) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const originOf = (req) => `${req.protocol}://${req.get('host')}`;
  const trackUrl = (req, token) => `${originOf(req)}/?token=${token}`;
  const safeNotify = async (fn) => {
    try { await fn(); } catch (e) { console.error('[notify]', e.message); }
  };

  // --- Público ---------------------------------------------------------------

  app.get('/api/room', (_req, res) => {
    res.json({
      room: ROOM, slots: SLOTS, slot_times: SLOT_TIMES,
      price_half_usd: PRICE_HALF_USD, price_day_usd: PRICE_DAY_USD,
    });
  });

  app.get('/api/availability', (req, res, next) => {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return res.status(400).json({ error: 'Parámetros "from" y "to" requeridos (YYYY-MM-DD).' });
      }
      res.json({ room_id: ROOM.id, from, to, occupied: getOccupiedBlocks(db, String(from), String(to)) });
    } catch (err) { next(err); }
  });

  app.post('/api/reservations', async (req, res, next) => {
    try {
      const r = createReservation(db, req.body ?? {});
      await safeNotify(() => notify.notifyCreated(mailer, r, trackUrl(req, r.token)));
      await safeNotify(() => notify.notifyAdminNew(mailer, db, r));
      res.status(201).json({ reservation: publicView(r), track_url: trackUrl(req, r.token) });
    } catch (err) { next(err); }
  });

  app.get('/api/reservations/:token', (req, res, next) => {
    try {
      const r = getByToken(db, req.params.token);
      if (!r) return res.status(404).json({ error: 'Reserva no encontrada.' });
      res.json({ reservation: publicView(r), cancel: cancelEligibility(db, r) });
    } catch (err) { next(err); }
  });

  // Cancelación autoservicio del solicitante (regla de 1 semana / 5 días hábiles).
  app.post('/api/reservations/:token/cancel', async (req, res, next) => {
    try {
      const r = selfCancelByToken(db, req.params.token);
      await safeNotify(() => notify.notifyCancelled(mailer, r));
      res.json({ reservation: publicView(r) });
    } catch (err) { next(err); }
  });

  // --- Administración --------------------------------------------------------

  const admin = requireAdmin(db);

  app.post('/api/admin/login', (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};
      const found = authenticate(db, username, password);
      setSessionCookie(res, createSession(db, found.id));
      res.json({ admin: { username: found.username } });
    } catch (err) { next(err); }
  });

  app.post('/api/admin/logout', admin, (req, res) => {
    deleteSession(db, req.sessionToken);
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/admin/me', admin, (req, res) => {
    res.json({ admin: { username: req.admin.username } });
  });

  app.get('/api/admin/reservations', admin, (req, res, next) => {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json({ counts: countByStatus(db), reservations: listReservations(db, { status }) });
    } catch (err) { next(err); }
  });

  app.post('/api/admin/reservations/:id/confirm', admin, async (req, res, next) => {
    try {
      const r = confirmReservation(db, Number(req.params.id), req.admin.id);
      await safeNotify(() => notify.notifyConfirmed(mailer, r, trackUrl(req, r.token)));
      res.json({ reservation: r });
    } catch (err) { next(err); }
  });

  app.post('/api/admin/reservations/:id/reject', admin, async (req, res, next) => {
    try {
      const r = rejectReservation(db, Number(req.params.id), req.admin.id, req.body?.reason);
      await safeNotify(() => notify.notifyRejected(mailer, r));
      res.json({ reservation: r });
    } catch (err) { next(err); }
  });

  app.post('/api/admin/reservations/:id/cancel', admin, async (req, res, next) => {
    try {
      const r = cancelReservation(db, Number(req.params.id), req.admin.id, req.body?.reason);
      await safeNotify(() => notify.notifyCancelled(mailer, r));
      res.json({ reservation: r });
    } catch (err) { next(err); }
  });

  // Configuración (correo de reportes / aviso de nuevas reservas).
  app.get('/api/admin/settings', admin, (_req, res) => {
    res.json({ report_email: getReportEmail(db), admin_notify_email: getAdminNotifyEmail(db) });
  });

  app.put('/api/admin/settings', admin, (req, res) => {
    if (req.body?.report_email !== undefined) setSetting(db, 'report_email', req.body.report_email);
    if (req.body?.admin_notify_email !== undefined) setSetting(db, 'admin_notify_email', req.body.admin_notify_email);
    res.json({ report_email: getReportEmail(db), admin_notify_email: getAdminNotifyEmail(db) });
  });

  // Reportes a finanzas.
  app.get('/api/admin/reports/reservations.csv', admin, (req, res, next) => {
    try {
      const rows = reservationsForReport(db, {
        from: req.query.from, to: req.query.to, status: req.query.status,
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="reservas.csv"');
      res.send(toCsv(rows));
    } catch (err) { next(err); }
  });

  app.get('/api/admin/reports/monthly.csv', admin, (req, res, next) => {
    try {
      const month = String(req.query.month || previousMonth());
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-${month}.csv"`);
      res.send(toCsv(monthlyBillable(db, month)));
    } catch (err) { next(err); }
  });

  app.post('/api/admin/reports/monthly/send', admin, async (req, res, next) => {
    try {
      const month = req.body?.month || previousMonth();
      const to = req.body?.to;
      if (!to && !getReportEmail(db)) {
        return res.status(400).json({ error: 'Configura el correo de reportes o indica un destinatario "to".' });
      }
      res.json(await sendMonthlyReport(db, mailer, month, to));
    } catch (err) { next(err); }
  });

  // --- Manejador de errores --------------------------------------------------
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
