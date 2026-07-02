---
project: "Reserva Sala de Entrenamiento 2C-1"
updated: "2026-07-02"
---

# Roadmap — Reserva Sala de Entrenamiento 2C-1

## Fase 1 — MVP
**Target:** (por definir tras aprobación del PRD)
**Objetivo:** Reservar la sala 2C-1 de punta a punta, sin doble reservas, con cobro a externos y
reporte a finanzas — reemplazando el Microsoft Form.

### Features incluidas:
- [ ] Formulario de reserva (13 preguntas) con lógica Internal(DISW)/External
- [ ] Calendario de disponibilidad por bloques AM/PM + validación de solapamiento
- [ ] Cálculo de costo (300/día, 150/medio día) para External
- [ ] Flujo Pendiente → Confirmada/Rechazada → Cancelada con validación del admin
- [ ] Notificaciones por correo institucional (Graph) + .ics en confirmación
- [ ] Cancelación autoservicio (≥ 2 días hábiles, festivos MX) por enlace único
- [ ] Módulo de administración con login (cola, calendario, configuración, admins)
- [ ] Export on-demand + reporte mensual automático al correo designado
- [ ] Bitácora de auditoría
- [ ] Modelo de datos multi-sala (aunque solo opere 2C-1)

### Gate de entrega:
- [ ] Happy path completo funciona en producción
- [ ] URL pública accesible (HTTPS)
- [ ] Tests pasando en CI

---

## Fase 2 — Multi-sala / Mejoras
**Target:** (posterior al MVP)
**Objetivo:** Operar más salas y sedes, y mejorar la operación con base en uso real.

### Features planificadas:
- [ ] Alta y operación de salas MTY / QRO desde la UI
- [ ] Administradores por sala/sede
- [ ] Gestión de recursos adicionales (catering, equipo, proyectores)
- [ ] Mejoras de UX basadas en feedback real

---

## Fase 3 — SSO y analítica / Escala
**Target:** (largo plazo)
**Objetivo:** Reducir fricción de identidad y dar visibilidad ejecutiva.

### Features planificadas:
- [ ] SSO Azure AD (identificación automática interno/externo)
- [ ] Tableros de ocupación e ingresos
- [ ] Integración más profunda con finanzas
- [ ] Migración definitiva a PostgreSQL en producción

---

## Decisiones de scope

| Decisión | Fase | Razón |
|----------|------|-------|
| Operación multi-sala (MTY/QRO) | 2 | El MVP solo administra 2C-1; el modelo de datos ya lo soporta |
| SSO Azure AD | 3 | El MVP usa autodeclaración + validación admin para evitar dependencia de Azure AD |
| Panel/conciliación de finanzas | 3 | El cobro ICC ocurre fuera del sistema; el MVP solo informa/reporta |
| Pasarela de pago | Fuera | El cobro es por movimiento ICC, no por pago en línea |
