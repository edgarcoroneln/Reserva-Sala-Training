---
project: "Reserva Sala de Entrenamiento 2C-1"
date: "2026-07-02"
author_human: "Edgar Coronel"
agent: "Claude Code"
model: "Claude Code (web)"
session_duration: "1h"
tags: [devlog, sprint-1, desarrollo, mvp, backend, frontend]
---

# DevLog — 2026-07-02 — MVP Rebanada 1 (reserva + disponibilidad)

## Qué se hizo
- Se inicializó el proyecto Node.js (`package.json`, ESM, scripts `start`/`dev`/`test`).
- **Backend (Express + SQLite integrado de Node):**
  - `src/config.js` — sala 2C-1, bloques AM/PM, tarifas (150/300), tipos de renta/duración.
  - `src/db.js` — esquema `rooms`/`reservations`/`blocks` con `UNIQUE(room,date,slot)` como
    garantía anti-doble-reserva (riesgo R06) y seed de la sala 2C-1.
  - `src/services/availability.js` — cálculo de bloques AM/PM, costo, y disponibilidad por rango.
  - `src/services/reservations.js` — creación transaccional de pre-reserva con chequeo de solape.
  - `src/app.js` / `src/server.js` — API REST y arranque.
- **API:** `GET /api/room`, `GET /api/availability`, `POST /api/reservations`, `GET /api/reservations/:token`.
- **Frontend (`public/`):** formulario de las 13 preguntas con campos ARE condicionados a External,
  selector AM/PM para medio día, costo estimado en vivo, y calendario mensual de disponibilidad
  con bloques AM/PM (libre/ocupado) + consulta por token.
- **Pruebas:** 19 tests (`node --test`) — unitarias de disponibilidad/costo, integración de
  creación/solape en BD, y pruebas de la API por HTTP.

## Verificación
- `npm test` → **19/19 en verde**.
- Smoke test por `curl`: creación 201 (costo 300), solape 409, disponibilidad refleja AM/PM,
  estáticos 200.
- Verificación en navegador real (Chromium/Playwright): calendario pintado (31 días × 2 bloques),
  campos ARE visibles en External, costo estimado 300 USD, envío exitoso con token. Captura guardada.

## Decisiones autónomas del agente
- Se usó **`node:sqlite`** (SQLite integrado de Node 22) en lugar de `better-sqlite3` para evitar
  compilación nativa; la capa de datos queda desacoplada para migrar a PostgreSQL.
- La tabla `blocks` solo guarda bloques de reservas activas; el `UNIQUE` da la garantía a nivel BD.
- `data/` y `*.db*` añadidos a `.gitignore`.

## Correcciones manuales
- (ninguna)

## Bloqueantes encontrados
- Ninguno. Nota: 404 de `/favicon.ico` en consola (inofensivo) resuelto con favicon inline.

## Próximos pasos
- **Rebanada 2:** lógica de estados (Confirmada/Rechazada) y validación DISW/ARE reforzada.
- **Rebanada 3:** módulo de administración con login.
- **Rebanada 4/5:** notificaciones (Graph), cancelación (regla 1 semana) y reportes.
