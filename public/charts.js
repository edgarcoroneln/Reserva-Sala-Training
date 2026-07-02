'use strict';

// Gráficas SVG sin dependencias, con la paleta validada del método de dataviz
// (modo claro). Marcas delgadas, extremos redondeados 4px, rejilla recesiva y
// etiquetas directas (pocas categorías) + <title> para hover.
// Envuelto en IIFE para no filtrar identificadores al ámbito global (evita
// colisiones con admin.js, que también corre como script global).
(() => {
const INK = '#0b0b0b';
const INK2 = '#52514e';
const MUTED = '#898781';
const GRID = '#e1e0d9';
const BASE = '#c3c2b7';
const TRACK = '#eceae3';

const COLORS = {
  blue: '#2a78d6',
  aqua: '#1baf7a',
  confirmed: '#0ca30c', // good
  pending: '#fab219', // warning
  rejected: '#d03b3b', // critical
  cancelled: '#898781', // muted
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Gráfica de barras. items: [{label, value, display, title}]. Si track=true pinta
// la capacidad de fondo. max define la escala (p. ej. 100 para %).
function barChart({ items, max, color = COLORS.blue, unit = '', track = false, gridPct = false }) {
  const W = 480;
  const H = 190;
  const padL = 12;
  const padR = 12;
  const padT = 20;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = Math.max(items.length, 1);
  const step = innerW / n;
  const bw = Math.min(40, step - 12);
  const top = max || Math.max(1, ...items.map((d) => d.value));
  const y = (v) => padT + innerH - (v / top) * innerH;

  let grid = '';
  const ticks = gridPct ? [0, 25, 50, 75, 100] : [0, 0.5, 1].map((f) => Math.round(top * f));
  const uniq = [...new Set(ticks)];
  for (const t of uniq) {
    const yy = y(t);
    grid += `<line x1="${padL}" y1="${yy.toFixed(1)}" x2="${W - padR}" y2="${yy.toFixed(1)}" stroke="${GRID}" stroke-width="1"/>`;
    grid += `<text x="${padL - 2}" y="${(yy - 2).toFixed(1)}" fill="${MUTED}" font-size="9" text-anchor="start">${t}${gridPct ? '%' : ''}</text>`;
  }

  let bars = '';
  items.forEach((d, i) => {
    const cx = padL + step * i + step / 2;
    const x = cx - bw / 2;
    if (track) {
      bars += `<rect x="${x.toFixed(1)}" y="${padT}" width="${bw.toFixed(1)}" height="${innerH.toFixed(1)}" rx="4" fill="${TRACK}"/>`;
    }
    const bh = Math.max(0, padT + innerH - y(d.value));
    bars += `<rect x="${x.toFixed(1)}" y="${y(d.value).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${color}"><title>${esc(d.title || `${d.label}: ${d.display ?? d.value}${unit}`)}</title></rect>`;
    if (d.value > 0 || track) {
      bars += `<text x="${cx.toFixed(1)}" y="${(y(d.value) - 5).toFixed(1)}" fill="${INK}" font-size="10" font-weight="700" text-anchor="middle">${esc(d.display ?? d.value)}${unit}</text>`;
    }
    bars += `<text x="${cx.toFixed(1)}" y="${(H - 8).toFixed(1)}" fill="${INK2}" font-size="9" text-anchor="middle">${esc(d.label)}</text>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" style="max-width:100%">
    ${grid}
    <line x1="${padL}" y1="${padT + innerH}" x2="${W - padR}" y2="${padT + innerH}" stroke="${BASE}" stroke-width="1.5"/>
    ${bars}
  </svg>`;
}

// Dona. segments: [{label, value, color}]. Devuelve {svg, legend}.
function donut(segments, { centerLabel = '', centerValue = '' } = {}) {
  const size = 150;
  const r = 58;
  const rin = 38;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let a0 = -Math.PI / 2;
  let arcs = '';
  const gap = 0.03; // separación entre segmentos
  segments.forEach((s) => {
    if (s.value <= 0) return;
    const frac = s.value / total;
    const a1 = a0 + frac * Math.PI * 2;
    const s0 = a0 + gap;
    const s1 = a1 - gap;
    if (s1 > s0) {
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (ang, rad) => `${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
      arcs += `<path d="M ${p(s0, r)} A ${r} ${r} 0 ${large} 1 ${p(s1, r)} L ${p(s1, rin)} A ${rin} ${rin} 0 ${large} 0 ${p(s0, rin)} Z" fill="${s.color}"><title>${esc(`${s.label}: ${s.value} (${Math.round(frac * 100)}%)`)}</title></path>`;
    }
    a0 = a1;
  });
  const svg = `<svg viewBox="0 0 ${size} ${size}" width="150" height="150" role="img">
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="22" font-weight="700" fill="${INK}">${esc(centerValue)}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="9" fill="${MUTED}">${esc(centerLabel)}</text>
  </svg>`;
  const legend = `<ul class="chart-legend">${segments.map((s) => `<li><span class="sw" style="background:${s.color}"></span>${esc(s.label)} <b>${s.value}</b></li>`).join('')}</ul>`;
  return { svg, legend };
}

window.Charts = { barChart, donut, COLORS };
})();
