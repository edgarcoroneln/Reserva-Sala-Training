---
project: "Reserva Sala de Entrenamiento 2C-1"
type: "Reporte Ejecutivo"
status: "Para revisión de stakeholders"
updated: "2026-07-02"
owner: "Edgar Coronel"
---

# Reporte Ejecutivo — App de Reserva de la Sala de Entrenamiento 2C-1

> **Documento complementario:** el detalle funcional y técnico está en el [[01_Product/PRD]].

---

## 1. El problema en una frase

La sala de entrenamientos **2C-1** de DISW se reserva hoy con un **Microsoft Form** que solo captura
datos: **no muestra disponibilidad, no evita choques de agenda, no calcula ni cobra la renta y no
deja trazabilidad para finanzas.** El resultado es trabajo manual, doble reservas y rentas externas
que a veces no se cobran.

## 2. La oportunidad

Reemplazar el Forms por una **aplicación web propia, sencilla y automatizada** que gestione el ciclo
completo de la reserva y siente las bases para escalar a más salas y sedes (MTY, QRO) sin rehacer el
proceso.

## 3. La solución propuesta (vista de negocio)

```
  Solicitante                Administrador                 Finanzas
  ───────────                ─────────────                 ────────
  Ve disponibilidad   ─►     Recibe la pre-reserva   ─►   Recibe el reporte
  (calendario AM/PM)         y la valida                   mensual con costos
        │                         │                            │
        ▼                         ▼                            ▼
  Pre-reserva  ──────►  Confirmada / Rechazada  ──────►  Cobro ICC (fuera del sistema)
   (con enlace              (correo automático,
    de seguimiento)          costo si aplica)
```

Una web donde **cualquier persona** entra por un enlace, ve la disponibilidad real de la sala en
bloques de **mañana/tarde**, y crea su solicitud respondiendo las mismas 13 preguntas de hoy. El
sistema **bloquea la agenda al instante**, avisa al administrador, y una vez validado envía la
**confirmación por correo** con el evento de calendario y —cuando corresponde— el **monto a cobrar**.

## 4. Reglas de negocio clave

- **DISW no paga.** Si el solicitante es de DISW (*Internal*), no se cobra ni se piden datos
  contables. Cualquier **otra unidad de negocio (*External*) sí paga** y debe capturar sus datos ARE.
- **Tarifa:** **300 USD por día** completo, **150 USD por medio día** (mañana o tarde). El cobro se
  realiza por **movimiento ICC**, fuera del sistema; la app solo lo calcula e informa.
- **Sin choques de agenda:** si un bloque ya está ocupado, la solicitud **no** se puede enviar.
- **Cancelación autoservicio** hasta **1 semana antes (5 días hábiles)** (considerando festivos de
  México); después, se gestiona con el administrador.
- **Validación humana:** todas las reservas pasan por el administrador antes de confirmarse.

## 5. Beneficios

| Beneficio | Impacto |
|-----------|---------|
| **Cero doble reservas** | La disponibilidad es la única fuente de verdad; se valida en tiempo real. |
| **Cobro trazable** | Toda renta externa queda registrada con sus datos contables (ARE, GL, etc.). |
| **Menos trabajo manual** | Confirmaciones, avisos y reporte mensual **automáticos** por correo. |
| **Experiencia self-service** | El usuario reserva y cancela solo, sin cadenas de correos. |
| **Listo para finanzas** | **Reporte mensual automático** al cierre, al correo que el admin designe. |
| **Escalable** | Diseñado para sumar MTY/QRO sin rehacer el sistema. |

## 6. Alcance del MVP

**Incluye:** formulario de reserva, calendario de disponibilidad AM/PM, lógica DISW/External con
costo, flujo Pendiente→Confirmada/Rechazada→Cancelada, notificaciones por correo institucional,
cancelación autoservicio, módulo de administración con login, export y reporte mensual automático,
y auditoría. **Solo opera la sala 2C-1**, con el modelo de datos ya preparado para multi-sala.

**No incluye (por ahora):** inicio de sesión corporativo (SSO), operación de MTY/QRO, pasarela de
pago (el cobro es ICC externo) y conciliación financiera dentro del sistema.

## 7. Enfoque técnico (resumen)

Aplicación web **JavaScript + HTML** con un **backend ligero (Node.js) y base de datos**, hospedada
en un servidor, integrada a **Microsoft 365**: envía correos desde el **buzón institucional** y
refleja los bloqueos en el **calendario de Outlook** de la sala, todo vía **Microsoft Graph**.
Interfaz y correos **en español**. Detalle en [[03_Architecture/System_Design]].

## 8. Supuestos y dependencias

- Se cuenta con un **buzón institucional** y permisos de **Microsoft Graph** para enviar correo y
  gestionar el calendario de la sala.
- Los solicitantes **autodeclaran** si son DISW o externos; el administrador valida.
- El cobro ICC ocurre en finanzas, **fuera** del sistema.
- Horarios de bloque (AM/PM), precios y festivos son **configurables** por el administrador.

## 9. Riesgos y mitigaciones (top)

| Riesgo | Mitigación |
|--------|-----------|
| Doble reserva por concurrencia | Validación transaccional de bloques en la base de datos |
| Falla de correo/calendario (Graph) | Reintentos y colas; la base de datos sigue siendo la fuente de verdad |
| Cálculo de días hábiles/festivos | Catálogo de festivos administrable + pruebas |
| Manejo de datos personales (PII) | Minimización de datos, acceso restringido y política de retención |

## 10. Roadmap y próximos pasos

- **Fase 1 (MVP):** sala 2C-1 con el flujo completo — *este entregable define el qué*.
- **Fase 2:** multi-sala/sede (MTY, QRO), administradores por sala, recursos adicionales.
- **Fase 3:** SSO Azure AD (interno/externo automático) y tableros de ocupación e ingresos.

**Próximo paso inmediato:** aprobar este PRD y priorizar el desarrollo del MVP (ver
[[00_Start_Here/Current_Build_Target]] y [[07_Roadmap/Roadmap]]).
