import ExcelJS from 'exceljs';
import { ROOM } from '../config.js';

const HEADER_FILL = 'FF0D7D84'; // teal de la app (ARGB)

const RES_COLUMNS = [
  { header: 'Token', key: 'token', width: 22 },
  { header: 'Evento', key: 'event_name', width: 26 },
  { header: 'Correo', key: 'contact_email', width: 26 },
  { header: 'Inicio', key: 'start_date', width: 12 },
  { header: 'Fin', key: 'end_date', width: 12 },
  { header: 'Duración', key: 'duration_type', width: 11 },
  { header: 'Turno', key: 'half_block', width: 8 },
  { header: 'Días', key: 'total_days', width: 6 },
  { header: 'Tipo', key: 'rental_type', width: 10 },
  { header: 'Costo USD', key: 'cost_usd', width: 11 },
  { header: 'Estado', key: 'status', width: 11 },
  { header: 'ARE', key: 'are', width: 12 },
  { header: 'ORG ID', key: 'org_id', width: 12 },
  { header: 'GL Account', key: 'gl_account', width: 12 },
  { header: 'Cost Center', key: 'cost_center', width: 12 },
  { header: 'Creada', key: 'created_at', width: 22 },
  { header: 'Decidida', key: 'decided_at', width: 22 },
];

function styleHeader(ws, cols = ws.columnCount) {
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.height = 18;
  for (let c = 1; c <= cols; c += 1) {
    row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    row.getCell(c).alignment = { vertical: 'middle' };
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

function addReservationsSheet(wb, rows, name = 'Reservas') {
  const ws = wb.addWorksheet(name);
  ws.columns = RES_COLUMNS;
  rows.forEach((r) => ws.addRow(r));
  ws.getColumn('cost_usd').numFmt = '#,##0" USD"';
  styleHeader(ws, RES_COLUMNS.length);
  ws.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + RES_COLUMNS.length)}1` };
  return ws;
}

export async function buildReservationsBuffer(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `Reserva Sala ${ROOM.id}`;
  addReservationsSheet(wb, rows);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildMonthlyBuffer({ month, rows, summary }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = `Reserva Sala ${ROOM.id}`;

  // Hoja Resumen
  const ws = wb.addWorksheet('Resumen');
  ws.mergeCells('A1:C1');
  ws.getCell('A1').value = `Reporte de utilización — Sala ${ROOM.id} (${month})`;
  ws.getCell('A1').font = { bold: true, size: 14 };

  const t = summary.totals;
  const kpis = [
    ['Periodo', `${summary.from} a ${summary.to}`],
    ['Utilización', `${t.utilization}%`],
    ['Bloques usados', t.blocksUsed],
    ['Capacidad (bloques)', t.capacity],
    ['Bloques AM', t.am],
    ['Bloques PM', t.pm],
    ['Ingresos (External confirmadas)', t.revenue],
    ['Reservas confirmadas', t.confirmed],
  ];
  ws.addRow([]);
  kpis.forEach(([k, v]) => {
    const r = ws.addRow([k, v]);
    r.getCell(1).font = { bold: true };
  });
  ws.getCell(`B${2 + kpis.length}`).numFmt = '#,##0" USD"'; // Ingresos

  // Tabla por mes
  ws.addRow([]);
  const head = ws.addRow(['Mes', 'Usados', 'Capacidad', 'Utilización %', 'Ingresos USD']);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }; });
  summary.byMonth.forEach((m) => ws.addRow([m.month, m.used, m.capacity, m.utilization, m.revenue]));
  ws.getColumn(1).width = 26;
  ws.getColumn(2).width = 12;
  ws.getColumn(5).width = 14;

  // Hoja detalle (facturables del mes)
  addReservationsSheet(wb, rows, 'Facturables');

  return Buffer.from(await wb.xlsx.writeBuffer());
}
