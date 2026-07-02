---
project: "Reserva Sala de Entrenamiento 2C-1"
updated: "2026-07-02"
---

# Risk Register — Reserva Sala de Entrenamiento 2C-1

> Riesgos identificados, su severidad y plan de mitigación.

---

## Riesgos activos

| ID | Riesgo | Severidad | Probabilidad | Mitigación | Estado |
|----|--------|-----------|-------------|------------|--------|
| R01 | Secret/API key comprometida (Graph, BD) | 🔴 Crítico | Baja | `.gitignore` estricto, variables de entorno, nunca hardcodear | Activo |
| R02 | Deuda técnica por over-engineering de IA | 🟠 Alto | Media | Revisar diff antes de commitear, scope claro por sesión | Activo |
| R03 | Dependencia de servicio externo sin fallback | 🟠 Alto | Media | Documentar dependencias en System_Design, agregar manejo de errores | Activo |
| R04 | Pérdida de contexto entre sesiones de IA | 🟡 Medio | Alta | DevLog obligatorio, CLAUDE.md actualizado, Current_Build_Target | Activo |
| R05 | Deploy roto sin reverting plan | 🟡 Medio | Baja | CI/CD con tests, rama `main` protegida, tags de release | Activo |
| R06 | **Doble reserva por concurrencia** (dos solicitudes al mismo bloque) | 🔴 Crítico | Media | Validación **transaccional** de bloques; restricción única (room_id, date, slot) en BD | Activo |
| R07 | **Falla de Microsoft Graph** (correo/calendario no disponible) | 🟠 Alto | Media | La BD es la fuente de verdad; **reintentos/cola** para correo y sync de calendario; degradación elegante | Activo |
| R08 | **Cálculo incorrecto de días hábiles/festivos MX** (regla de cancelación) | 🟠 Alto | Media | Catálogo de festivos **administrable** + pruebas unitarias del cálculo | Activo |
| R09 | **Manejo indebido de PII** (nombre/correo + datos ARE) | 🟠 Alto | Baja | Minimización de datos, acceso restringido a admins, política de retención, HTTPS | Activo |
| R10 | **Renta externa no cobrada / reporte incompleto** | 🟠 Alto | Media | Costo obligatorio en *External*, ARE requeridos, reporte mensual automático auditado | Activo |
| R11 | **Autodeclaración incorrecta** (externo se declara DISW para no pagar) | 🟡 Medio | Media | **Validación humana** del admin antes de confirmar; auditoría; a futuro SSO (Fase 3) | Activo |
| R12 | **Abuso del formulario abierto** (spam de pre-reservas) | 🟡 Medio | Media | Rate limiting, validación de correo, expiración de pendientes no validadas | Activo |
| R13 | Cobro ICC ocurre fuera del sistema (sin conciliación) | 🟢 Bajo | Alta | El sistema informa/reporta; conciliación explícitamente fuera de alcance (finanzas) | Aceptado |

---

## Cómo agregar un riesgo

Cuando identifiques un riesgo nuevo:
1. Dale un ID secuencial (R14, R15, etc.)
2. Evalúa severidad: 🔴 Crítico / 🟠 Alto / 🟡 Medio / 🟢 Bajo
3. Define la mitigación antes de que el riesgo se materialice
4. Cambia el estado a **Resuelto** cuando esté mitigado

---

## Riesgos resueltos

| ID | Riesgo | Cómo se resolvió | Fecha |
|----|--------|-----------------|-------|
| (mover aquí cuando se resuelvan) | | | |
