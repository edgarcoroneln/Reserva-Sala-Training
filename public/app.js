'use strict';

// Estado del calendario visible.
let viewYear;
let viewMonth; // 0-11
let config = { slot_times: { AM: '', PM: '' }, price_half_usd: 150, price_day_usd: 300 };

const $ = (sel) => document.querySelector(sel);
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ---- Calendario -------------------------------------------------------------

async function loadConfig() {
  const { ok, data } = await api('/api/room');
  if (ok) {
    config = data;
    $('#amTime').textContent = data.slot_times.AM;
    $('#pmTime').textContent = data.slot_times.PM;
  }
}

async function renderCalendar() {
  const first = new Date(Date.UTC(viewYear, viewMonth, 1));
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const from = iso(viewYear, viewMonth, 1);
  const to = iso(viewYear, viewMonth, daysInMonth);

  $('#monthLabel').textContent = `${MONTHS[viewMonth]} ${viewYear}`;

  const { data } = await api(`/api/availability?from=${from}&to=${to}`);
  const busy = new Set((data.occupied || []).map((b) => `${b.date}|${b.slot}`));

  const cal = $('#calendar');
  cal.innerHTML = '';
  DOW.forEach((d) => {
    const el = document.createElement('div');
    el.className = 'dow';
    el.textContent = d;
    cal.appendChild(el);
  });

  const startDow = first.getUTCDay();
  for (let i = 0; i < startDow; i++) {
    const el = document.createElement('div');
    el.className = 'day empty';
    cal.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = iso(viewYear, viewMonth, d);
    const dow = new Date(Date.UTC(viewYear, viewMonth, d)).getUTCDay();
    const cell = document.createElement('div');
    cell.className = 'day' + (dow === 0 || dow === 6 ? ' weekend' : '');
    cell.innerHTML =
      `<div class="num">${d}</div>` +
      `<div class="slots">` +
      `<span class="slot ${busy.has(`${date}|AM`) ? 'busy' : 'free'}" title="Mañana">AM</span>` +
      `<span class="slot ${busy.has(`${date}|PM`) ? 'busy' : 'free'}" title="Tarde">PM</span>` +
      `</div>`;
    cal.appendChild(cell);
  }
}

// ---- Formulario -------------------------------------------------------------

function isHalf() {
  return $('input[name="duration_type"]:checked')?.value === 'half';
}
function isExternal() {
  return $('input[name="rental_type"]:checked')?.value === 'external';
}

function countDays(start, end) {
  if (!start || !end || end < start) return 0;
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  return Math.round((b - a) / 86400000) + 1;
}

function updateTotalDays() {
  const start = $('#start_date').value;
  const end = $('#end_date').value;
  $('#total_days').value = countDays(start, end) || '';
}

function updateCostPreview() {
  const box = $('#costPreview');
  if (!isExternal()) {
    box.classList.add('hidden');
    return;
  }
  const start = $('#start_date').value;
  const end = $('#end_date').value;
  let blocks = 0;
  if (isHalf()) {
    blocks = start && start === end ? 1 : 0;
  } else {
    blocks = countDays(start, end) * 2;
  }
  box.classList.remove('hidden');
  box.textContent = blocks > 0
    ? `Costo estimado: ${blocks} bloque(s) × ${config.price_half_usd} USD = ${blocks * config.price_half_usd} USD`
    : 'Costo estimado: elige fechas válidas.';
}

function syncConditionalFields() {
  $('#halfBlockWrap').classList.toggle('hidden', !isHalf());
  $('#areFields').classList.toggle('hidden', !isExternal());
  updateCostPreview();
}

function collectPayload() {
  const f = $('#reservaForm');
  const get = (n) => f.elements[n]?.value?.trim() || '';
  const payload = {
    event_name: get('event_name'),
    contact_email: get('contact_email'),
    start_date: get('start_date'),
    end_date: get('end_date'),
    duration_type: $('input[name="duration_type"]:checked')?.value,
    rental_type: $('input[name="rental_type"]:checked')?.value,
    notes: get('notes'),
  };
  if (isHalf()) payload.half_block = $('input[name="half_block"]:checked')?.value || '';
  if (isExternal()) {
    payload.are = get('are');
    payload.org_id = get('org_id');
    payload.gl_account = get('gl_account');
    payload.cost_center = get('cost_center');
  }
  return payload;
}

// Validación mínima del lado del cliente (el servidor es la fuente de verdad).
function clientValidate(p) {
  if (!p.event_name) return 'Falta el nombre del evento.';
  if (!p.contact_email) return 'Falta el correo de contacto.';
  if (!p.start_date || !p.end_date) return 'Faltan las fechas.';
  if (p.end_date < p.start_date) return 'La fecha de fin no puede ser anterior a la de inicio.';
  if (p.duration_type === 'half') {
    if (p.start_date !== p.end_date) return 'Un medio día aplica solo a reservas de un día.';
    if (!p.half_block) return 'Elige el bloque AM o PM para medio día.';
  }
  if (p.rental_type === 'external') {
    for (const [k, label] of [['are', 'ARE'], ['org_id', 'ORG ID'], ['gl_account', 'GL Account'], ['cost_center', 'Cost Center']]) {
      if (!p[k]) return `Para renta External, el campo ${label} es obligatorio.`;
    }
  }
  return null;
}

async function onSubmit(e) {
  e.preventDefault();
  const msg = $('#formMsg');
  const payload = collectPayload();
  const localErr = clientValidate(payload);
  if (localErr) {
    msg.className = 'msg err';
    msg.textContent = localErr;
    return;
  }

  $('#submitBtn').disabled = true;
  const { ok, status, data } = await api('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  $('#submitBtn').disabled = false;

  if (ok) {
    const r = data.reservation;
    const cost = r.rental_type === 'external' ? ` · Costo: ${r.cost_usd} USD` : ' · Sin costo (DISW)';
    msg.className = 'msg ok';
    msg.innerHTML =
      `✅ Pre-reserva creada (estado: pendiente de validación)${cost}.<br />` +
      `Guarda tu código de seguimiento: <code>${r.token}</code>`;
    $('#reservaForm').reset();
    syncConditionalFields();
    updateTotalDays();
    renderCalendar();
  } else if (status === 409) {
    msg.className = 'msg err';
    msg.textContent = `⛔ ${data.error || 'Esas fechas ya están ocupadas.'}`;
    renderCalendar();
  } else {
    msg.className = 'msg err';
    msg.textContent = `⚠️ ${data.error || 'No se pudo crear la reserva.'}`;
  }
}

// ---- Consulta por token -----------------------------------------------------

async function onLookup() {
  const token = $('#tokenInput').value.trim();
  const box = $('#lookupResult');
  if (!token) { box.textContent = 'Escribe un código.'; return; }
  const { ok, data } = await api(`/api/reservations/${encodeURIComponent(token)}`);
  if (!ok) { box.textContent = data.error || 'No encontrada.'; return; }
  const r = data.reservation;
  const rows = [
    ['Evento', r.event_name],
    ['Estado', `<span class="badge ${r.status}">${r.status}</span>`],
    ['Fechas', `${r.start_date} → ${r.end_date}`],
    ['Duración', r.duration_type === 'half' ? `Medio día (${r.half_block})` : 'Día completo'],
    ['Tipo', r.rental_type === 'external' ? 'External' : 'Internal (DISW)'],
    ['Costo', r.rental_type === 'external' ? `${r.cost_usd} USD` : 'Sin costo'],
  ];
  let action = '';
  const c = data.cancel || {};
  if (c.cancelable) {
    action = `<button type="button" class="btn-danger" id="cancelBtn" data-token="${r.token}">Cancelar reserva</button>`;
  } else if (r.status === 'pending' || r.status === 'confirmed') {
    action = `<p class="hint">La cancelación en línea requiere al menos ${c.min_required} días hábiles de anticipación (disponibles: ${c.business_days}). Contacta al administrador para cancelar.</p>`;
  }
  box.innerHTML =
    '<table>' + rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>' + action;

  const btn = $('#cancelBtn');
  if (btn) btn.addEventListener('click', () => doCancel(btn.dataset.token));
}

async function doCancel(token) {
  if (!confirm('¿Seguro que deseas cancelar esta reserva? Se liberará el horario.')) return;
  const { ok, data } = await api(`/api/reservations/${encodeURIComponent(token)}/cancel`, { method: 'POST' });
  const box = $('#lookupResult');
  if (!ok) {
    box.insertAdjacentHTML('beforeend', `<p class="msg err">${data.error || 'No se pudo cancelar.'}</p>`);
    return;
  }
  onLookup();
  renderCalendar();
}

// ---- Init -------------------------------------------------------------------

function init() {
  const now = new Date();
  viewYear = now.getUTCFullYear();
  viewMonth = now.getUTCMonth();

  $('#prevMonth').addEventListener('click', () => { if (--viewMonth < 0) { viewMonth = 11; viewYear--; } renderCalendar(); });
  $('#nextMonth').addEventListener('click', () => { if (++viewMonth > 11) { viewMonth = 0; viewYear++; } renderCalendar(); });

  $('#reservaForm').addEventListener('change', syncConditionalFields);
  $('#start_date').addEventListener('change', () => { updateTotalDays(); updateCostPreview(); });
  $('#end_date').addEventListener('change', () => { updateTotalDays(); updateCostPreview(); });
  $('#reservaForm').addEventListener('submit', onSubmit);
  $('#lookupBtn').addEventListener('click', onLookup);

  loadConfig();
  renderCalendar();
  syncConditionalFields();

  // Si llegan con ?token=... (enlace del correo), consulta la reserva al vuelo.
  const token = new URLSearchParams(location.search).get('token');
  if (token) {
    $('#tokenInput').value = token;
    onLookup();
    $('#lookupResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

document.addEventListener('DOMContentLoaded', init);
