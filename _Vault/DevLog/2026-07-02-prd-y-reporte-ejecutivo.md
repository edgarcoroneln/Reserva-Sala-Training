---
project: "Reserva Sala de Entrenamiento 2C-1"
date: "2026-07-02"
author_human: "Edgar Coronel"
agent: "Claude Code"
model: "Claude Code (web)"
session_duration: "1h"
tags: [devlog, sprint-1, producto, prd]
---

# DevLog — 2026-07-02 — PRD y Reporte Ejecutivo de la app de reserva 2C-1

## Qué se hizo
- Entrevista de descubrimiento (12 preguntas) para definir el producto que reemplaza el Microsoft
  Form de reserva de la sala de entrenamientos 2C-1.
- Redacción del **PRD detallado** ([[01_Product/PRD]]) con épicas, criterios de aceptación, reglas
  de negocio, arquitectura, no-funcionales y anexos (estados, correos, modelo de datos, cálculos).
- Redacción del **Reporte Ejecutivo** ([[01_Product/Reporte_Ejecutivo]]) para stakeholders.
- Poblado de documentos de soporte del Vault para dejar todo coherente: `PROJECT_INDEX`,
  `Current_Build_Target`, `User_Stories`, `System_Design`, `Risk_Register`, `Roadmap`, `CLAUDE.md`.

## Decisiones autónomas del agente
- Se establecieron supuestos configurables (horarios de bloque AM 08:00–13:00 / PM 13:00–18:00,
  antelación mínima y horizonte máximo) y se documentaron como parámetros del administrador.
- Se propuso el modelo de datos multi-sala y la máquina de estados de la reserva.
- Se agregaron riesgos específicos del proyecto (R06–R13) al Risk Register.

## Decisiones del stakeholder (entrevista)
- App JS+HTML que reemplaza al Forms + integración Microsoft 365 (Graph: correo + calendario).
- Internal = DISW (sin costo/ARE); External = cobro (300/día, 150/medio día) + ARE (10–13).
- Disponibilidad por bloques AM/PM; MVP solo 2C-1 con modelo multi-sala.
- Cancelación autoservicio ≥ 2 días hábiles (festivos MX); estados Pendiente→Confirmada/Rechazada→Cancelada.
- Backend Node.js + BD (SQLite→PostgreSQL); login propio de admin; formulario abierto + enlace único.
- Reporte mensual automático al correo designado; idioma español.

## Correcciones manuales
- (ninguna hasta ahora)

## Bloqueantes encontrados
- Ninguno. Pendiente confirmar acceso a buzón institucional y permisos de Microsoft Graph antes de
  implementar (correo + calendario de la sala).

## Próximos pasos
- Aprobación del PRD por el stakeholder.
- Planear el Sprint de implementación del MVP (frontend + backend + integraciones + despliegue).
