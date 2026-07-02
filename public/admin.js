'use strict';

const $ = (sel) => document.querySelector(sel);
let currentStatus = 'pending';

async function api(path, options) {
  const res = await fetch(path, { credentials: 'same-origin', ...options });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Vistas ------------------------------------------------------------------

function showLogin() {
  $('#loginView').classList.remove('hidden');
  $('#dashView').classList.add('hidden');
}

function showDash(username) {
  $('#loginView').classList.add('hidden');
  $('#dashView').classList.remove('hidden');
  $('#whoami').textContent = `Sesión: ${username}`;
  loadReservations();
}

async function checkSession() {
  const { ok, data } = await api('/api/admin/me');
  if (ok) showDash(data.admin.username);
  else showLogin();
}

// --- Login / logout ----------------------------------------------------------

async function onLogin(e) {
  e.preventDefault();
  const msg = $('#loginMsg');
  msg.textContent = '';
  const f = e.target;
  const { ok, data } = await api('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: f.username.value, password: f.password.value }),
  });
  if (ok) {
    f.reset();
    showDash(data.admin.username);
  } else {
    msg.className = 'msg err';
    msg.textContent = data.error || 'No se pudo iniciar sesión.';
  }
}

async function onLogout() {
  await api('/api/admin/logout', { method: 'POST' });
  showLogin();
}

// --- Tablero -----------------------------------------------------------------

function renderCounts(counts) {
  const items = [
    ['Pendientes', counts.pending, 'pending'],
    ['Confirmadas', counts.confirmed, 'confirmed'],
    ['Rechazadas', counts.rejected, 'rejected'],
    ['Canceladas', counts.cancelled, 'cancelled'],
  ];
  $('#counts').innerHTML = items
    .map(([label, n, cls]) => `<span class="count-pill ${cls}"><b>${n}</b> ${label}</span>`)
    .join('');
}

function actionsFor(r) {
  if (r.status === 'pending') {
    return `<button class="btn-ok" data-act="confirm" data-id="${r.id}">Confirmar</button>
            <button class="btn-danger" data-act="reject" data-id="${r.id}">Rechazar</button>`;
  }
  if (r.status === 'confirmed') {
    return `<button class="btn-danger" data-act="cancel" data-id="${r.id}">Cancelar</button>`;
  }
  return '<span class="muted">—</span>';
}

function rowHtml(r) {
  const dur = r.duration_type === 'half' ? `Medio día (${r.half_block})` : 'Día completo';
  const tipo = r.rental_type === 'external' ? 'External' : 'Internal (DISW)';
  const costo = r.rental_type === 'external' ? `${r.cost_usd} USD` : '—';
  const are = r.rental_type === 'external'
    ? `ARE ${esc(r.are)} · ORG ${esc(r.org_id)} · GL ${esc(r.gl_account)} · CC ${esc(r.cost_center)}`
    : '';
  const reason = r.rejected_reason ? `<div class="muted">Motivo: ${esc(r.rejected_reason)}</div>` : '';
  return `<tr>
    <td>
      <strong>${esc(r.event_name)}</strong><br />
      <span class="muted">${esc(r.contact_email)}</span>
      ${are ? `<div class="muted small">${are}</div>` : ''}
      ${reason}
    </td>
    <td>${r.start_date}${r.end_date !== r.start_date ? ` → ${r.end_date}` : ''}<br /><span class="muted">${dur}</span></td>
    <td>${tipo}</td>
    <td>${costo}</td>
    <td><span class="badge ${r.status}">${r.status}</span></td>
    <td class="actions">${actionsFor(r)}</td>
  </tr>`;
}

async function loadReservations() {
  const q = currentStatus ? `?status=${currentStatus}` : '';
  const { ok, status, data } = await api(`/api/admin/reservations${q}`);
  if (!ok) {
    if (status === 401) return showLogin();
    $('#tableWrap').innerHTML = `<p class="msg err">${data.error || 'Error al cargar.'}</p>`;
    return;
  }
  renderCounts(data.counts);
  const rows = data.reservations;
  if (rows.length === 0) {
    $('#tableWrap').innerHTML = '<p class="muted" style="padding:1rem">Sin reservas en este filtro.</p>';
    return;
  }
  $('#tableWrap').innerHTML = `<table class="admin-table">
    <thead><tr><th>Solicitante</th><th>Fechas</th><th>Tipo</th><th>Costo</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>${rows.map(rowHtml).join('')}</tbody>
  </table>`;
}

async function onAction(e) {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const { act, id } = btn.dataset;
  let body;
  if (act === 'reject') {
    const reason = prompt('Motivo del rechazo (opcional):') ?? '';
    body = JSON.stringify({ reason });
  } else if (act === 'cancel') {
    if (!confirm('¿Cancelar esta reserva confirmada? Se liberará el calendario.')) return;
    body = JSON.stringify({ reason: 'Cancelada por administración' });
  }
  btn.disabled = true;
  const { ok, status, data } = await api(`/api/admin/reservations/${id}/${act}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!ok) {
    if (status === 401) return showLogin();
    alert(data.error || 'No se pudo completar la acción.');
    btn.disabled = false;
    return;
  }
  loadReservations();
}

// --- Init --------------------------------------------------------------------

function init() {
  $('#loginForm').addEventListener('submit', onLogin);
  $('#logoutBtn').addEventListener('click', onLogout);
  $('#refreshBtn').addEventListener('click', loadReservations);
  $('#tableWrap').addEventListener('click', onAction);
  $('#filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.dataset.status;
    loadReservations();
  });
  checkSession();
}

document.addEventListener('DOMContentLoaded', init);
