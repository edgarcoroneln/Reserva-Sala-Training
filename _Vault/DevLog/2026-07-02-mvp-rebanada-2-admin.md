---
project: "Reserva Sala de Entrenamiento 2C-1"
date: "2026-07-02"
author_human: "Edgar Coronel"
agent: "Claude Code"
model: "Claude Code (web)"
session_duration: "1h"
tags: [devlog, sprint-1, desarrollo, mvp, admin, auth]
---

# DevLog — 2026-07-02 — MVP Rebanada 2 (módulo de administración)

## Qué se hizo
- **Autenticación de administradores** (`src/services/admins.js` + `src/middleware/auth.js`):
  hash de contraseñas con **scrypt** (sin dependencias nativas), sesiones con **cookie httpOnly**
  (`SameSite=Strict`), y siembra de un admin por defecto (`admin`/`admin123`, configurable con
  `ADMIN_USER`/`ADMIN_PASSWORD`).
- **Esquema ampliado** (`src/db.js`): tablas `admins`, `sessions`, `audit_log`; columnas
  `rejected_reason`, `decided_by`, `decided_at` en `reservations`, con **migración suave**
  (`ensureColumn`) para BD creadas por la Rebanada 1.
- **Transiciones de estado** (`src/services/reservations.js`): `confirmReservation`,
  `rejectReservation`, `cancelReservation` (rechazo/cancelación **liberan el calendario**),
  `listReservations`, `countByStatus` y `auditLog`.
- **API de administración** (`src/app.js`): login/logout/me, listado con conteos, y
  confirmar/rechazar/cancelar, todas protegidas por sesión.
- **Frontend admin** (`public/admin.html` + `public/admin.js`): pantalla de login, tablero con
  conteos por estado, filtros, tabla de reservas con datos ARE y acciones (confirmar/rechazar/
  cancelar). Enlace "Administración" agregado a la página pública.

## Verificación
- `npm test` → **30/30 en verde** (11 nuevas: hash, auth, sesiones, transiciones, auditoría, y
  flujo HTTP con cookie).
- Verificación en navegador real (Chromium): login requerido sin sesión, 3 pendientes en cola,
  rechazo con motivo y confirmación → conteos 1/1/1/0 sin errores de consola. Captura guardada.

## Decisiones autónomas del agente
- Sesión por **cookie httpOnly** con parseo propio de cookies (sin `cookie-parser`), sin `Secure`
  en local (agregar en producción HTTPS).
- La tabla `blocks` sigue siendo la garantía anti-solape; rechazar/cancelar eliminan sus bloques.

## Correcciones manuales
- (ninguna)

## Bloqueantes encontrados
- Ninguno. Recordatorio: cambiar la contraseña por defecto del admin en cualquier despliegue real.

## Próximos pasos
- **Rebanada 4:** notificaciones por correo (Microsoft Graph) en cada transición + .ics.
- **Rebanada 5:** cancelación autoservicio del usuario (regla de 1 semana) y reportes a finanzas.
