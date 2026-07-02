import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'reservas.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = createDb(dbPath);
const app = createApp(db);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Reserva Sala 2C-1 — servidor en http://localhost:${PORT}`);
});
