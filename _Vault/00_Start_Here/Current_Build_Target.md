---
project: "Reserva Sala de Entrenamiento 2C-1"
updated: "2026-07-02"
sprint: "Sprint 1"
---

# Current Build Target — Reserva Sala de Entrenamiento 2C-1

> Este archivo responde UNA pregunta: **¿Qué estoy construyendo ahora mismo?**
> Actualízalo al inicio de cada sesión de trabajo.

---

## Objetivo del sprint actual

**Sprint 1 — Fecha inicio:** 2026-07-02
**Milestone / PoC:** Definición del producto — **PRD detallado + Reporte Ejecutivo** aprobados como
base para construir el MVP de la app de reserva de la sala 2C-1.

### Qué debe funcionar al final de este sprint:
- [x] PRD detallado escrito en [[01_Product/PRD]]
- [x] Reporte Ejecutivo escrito en [[01_Product/Reporte_Ejecutivo]]
- [x] Documentación del Vault coherente (índice, historias, arquitectura, riesgos, roadmap)
- [x] **MVP Rebanada 1** — reserva + disponibilidad AM/PM + anti-solapamiento (backend + frontend + pruebas)
- [x] **MVP Rebanada 2** — módulo de administración: login, cola de validación, confirmar/rechazar/cancelar, auditoría
- [x] **MVP Rebanada 4** — notificaciones por correo (transporte console/Graph, .ics)
- [x] **MVP Rebanada 5** — cancelación autoservicio (regla 1 semana + festivos MX) + reportes a finanzas

---

## Tarea activa HOY

**Estoy trabajando en:** **MVP completo (rebanadas 1–5)** — 47 pruebas en verde, verificado por
navegador y curl. Pendiente: credenciales de Microsoft Graph para envío real de correo, y Fases 2–3
(multi-sala, SSO) del Roadmap.

**Archivos que voy a tocar:**
- `src/` (backend Express + servicios)
- `public/` (frontend)
- `tests/` (pruebas)

**Dependencias que necesito:**
- Confirmación de acceso a **buzón institucional** y permisos de **Microsoft Graph** antes de la
  implementación (correo + calendario de la sala).

---

## Lo que NO entra en este sprint

- Implementación del código de la app (frontend/backend/integraciones) — es el siguiente sprint,
  gobernado por este PRD.
- SSO Azure AD y operación multi-sala (MTY/QRO) — Fase 2/3.

---

## Gate de entrega

Para considerar este sprint completo:
- [x] PRD y Reporte Ejecutivo completos y sin placeholders
- [ ] PRD aprobado por el stakeholder
- [ ] DevLog actualizado
- [ ] Documentos versionados (commit + push) en la rama de trabajo
