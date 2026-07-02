import { ROOM, SLOT_TIMES } from '../config.js';
import { getAdminNotifyEmail } from './settings.js';

function durationText(r) {
  return r.duration_type === 'half' ? `Medio día (${r.half_block})` : 'Día completo (AM + PM)';
}

function datesText(r) {
  return r.start_date === r.end_date ? r.start_date : `${r.start_date} → ${r.end_date}`;
}

function costText(r) {
  return r.rental_type === 'external' ? `${r.cost_usd} USD` : 'Sin costo (DISW)';
}

function baseDetail(r) {
  return `
    <ul>
      <li><b>Evento:</b> ${escapeHtml(r.event_name)}</li>
      <li><b>Sala:</b> ${ROOM.name} (${ROOM.site})</li>
      <li><b>Fechas:</b> ${datesText(r)} — ${durationText(r)}</li>
      <li><b>Tipo:</b> ${r.rental_type === 'external' ? 'External' : 'Internal (DISW)'}</li>
      <li><b>Costo:</b> ${costText(r)}</li>
    </ul>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Genera un archivo .ics mínimo para el bloque reservado.
export function buildIcs(r) {
  const [amStart] = SLOT_TIMES.AM.split('–');
  const [, pmEnd] = SLOT_TIMES.PM.split('–');
  let startTime = amStart;
  let endTime = pmEnd;
  if (r.duration_type === 'half') {
    if (r.half_block === 'AM') [startTime, endTime] = SLOT_TIMES.AM.split('–');
    else [startTime, endTime] = SLOT_TIMES.PM.split('–');
  }
  const dt = (date, time) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Reserva 2C-1//ES',
    'BEGIN:VEVENT',
    `UID:${r.token}@reserva-2c1`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt(r.start_date, startTime)}`,
    `DTEND:${dt(r.end_date, endTime)}`,
    `SUMMARY:${r.event_name} — Sala ${ROOM.id}`,
    `LOCATION:${ROOM.name}, ${ROOM.site}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// --- Disparadores de notificación -------------------------------------------

export async function notifyCreated(mailer, r, trackUrl) {
  await mailer.send({
    to: r.contact_email,
    subject: `Recibimos tu solicitud de reserva — Sala ${ROOM.id}`,
    template: 'created',
    reservationId: r.id,
    body: `<p>¡Hola!</p><p>Recibimos tu solicitud (estado: <b>pendiente de validación</b>).</p>
      ${baseDetail(r)}
      <p>Puedes dar seguimiento y, si aplica, cancelar tu reserva aquí:<br>
      <a href="${trackUrl}">${trackUrl}</a></p>`,
  });
}

export async function notifyAdminNew(mailer, db, r) {
  await mailer.send({
    to: getAdminNotifyEmail(db),
    subject: `Nueva pre-reserva pendiente de validar — Sala ${ROOM.id}`,
    template: 'admin_new',
    reservationId: r.id,
    body: `<p>Hay una nueva pre-reserva pendiente de validación.</p>${baseDetail(r)}
      <p>Solicitante: ${escapeHtml(r.contact_email)}</p>`,
  });
}

export async function notifyConfirmed(mailer, r, trackUrl) {
  const cost = r.rental_type === 'external'
    ? `<p><b>Monto por la renta:</b> ${r.cost_usd} USD (se cobrará por movimiento ICC).</p>`
    : '';
  await mailer.send({
    to: r.contact_email,
    subject: `Tu reserva de la Sala ${ROOM.id} está confirmada`,
    template: 'confirmed',
    reservationId: r.id,
    attachments: [{ filename: `reserva-${ROOM.id}.ics`, content: buildIcs(r) }],
    body: `<p>¡Tu reserva quedó <b>confirmada</b>!</p>${baseDetail(r)}${cost}
      <p>Adjuntamos el evento de calendario (.ics).</p>
      <p>Seguimiento: <a href="${trackUrl}">${trackUrl}</a></p>`,
  });
}

export async function notifyRejected(mailer, r) {
  const reason = r.rejected_reason ? `<p><b>Motivo:</b> ${escapeHtml(r.rejected_reason)}</p>` : '';
  await mailer.send({
    to: r.contact_email,
    subject: `Tu solicitud de la Sala ${ROOM.id} no fue aprobada`,
    template: 'rejected',
    reservationId: r.id,
    body: `<p>Lamentamos informarte que tu solicitud <b>no fue aprobada</b>.</p>${baseDetail(r)}${reason}`,
  });
}

export async function notifyCancelled(mailer, r) {
  await mailer.send({
    to: r.contact_email,
    subject: `Cancelación confirmada — Sala ${ROOM.id}`,
    template: 'cancelled',
    reservationId: r.id,
    body: `<p>Tu reserva fue <b>cancelada</b> y el horario quedó liberado.</p>${baseDetail(r)}`,
  });
}
