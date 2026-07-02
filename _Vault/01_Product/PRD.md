---
project: "Reserva Sala de Entrenamiento 2C-1"
version: "1.0"
status: "Aprobado — MVP"
updated: "2026-07-02"
owner: "Edgar Coronel"
---

# PRD — Reserva de Sala de Entrenamiento 2C-1 (DISW)

> **Resumen en una línea:** Aplicación web que reemplaza el Microsoft Form actual para reservar la
> sala de entrenamientos **2C-1** de DISW, validando disponibilidad en tiempo real, aplicando el
> costo de renta a unidades ajenas a DISW y dejando trazabilidad para finanzas.

**Documentos relacionados:** [[00_Start_Here/Current_Build_Target]] · [[02_Requirements/User_Stories]] · [[03_Architecture/System_Design]] · [[03_Architecture/API_Specification]] · [[07_Roadmap/Roadmap]] · [[09_Risk_Governance/Risk_Register]] · [[01_Product/Reporte_Ejecutivo]]

---

## §1 Contexto y problema

**¿Qué problema resuelve este proyecto?**

DISW (Siemens Digital Industries Software) opera una sala de entrenamientos, la **2C-1**, ubicada en
las oficinas de **2 Patios** (2º piso, cuadrante C, sala 1, Ciudad de México). Hoy la sala se
solicita mediante un **Microsoft Form** de 13 preguntas. Ese formulario captura datos, pero **no
resuelve el proceso**: no muestra disponibilidad, no evita solapamientos, no calcula ni comunica el
costo de renta, no notifica al solicitante ni al administrador, y no deja un registro consolidado
para que finanzas cobre.

En consecuencia, hoy ocurren fricciones recurrentes: solicitudes para fechas ya ocupadas, ida y
vuelta manual por correo para confirmar, cálculo del costo "a mano", olvido de cobrar a unidades de
negocio externas a DISW, y falta de un reporte confiable para el cierre mensual de finanzas. El
administrador de la sala dedica tiempo operativo a tareas que deberían estar automatizadas, y no
existe una única fuente de verdad de la ocupación de la sala.

Si no se resuelve, el problema escala cuando se sumen más salas/sedes (MTY, QRO): el proceso manual
no es sostenible, se pierden ingresos por rentas no cobradas y se degrada la experiencia de quienes
necesitan la sala para entrenamientos.

---

## §2 Visión y North Star

**Visión:** Que cualquier persona de Siemens pueda reservar la sala 2C-1 en menos de 3 minutos,
viendo la disponibilidad real, con confirmación y (cuando aplique) cobro automáticos, y con cero
solapamientos — sentando la base para administrar múltiples salas y sedes.

**North Star Metric:** **Reservas confirmadas sin conflicto por mes** (ocupación efectiva de la sala
gestionada 100% por la app).

**Métricas de éxito del MVP:**

| Métrica | Target | Cómo medir |
|---------|--------|------------|
| Solapamientos / doble reservas | **0** | Conflictos detectados en BD (bloques con doble ocupación) |
| Tiempo de validación de una pre-reserva | **< 24 h hábiles** | Timestamp `Pendiente → Confirmada/Rechazada` |
| Rentas externas cobradas vs. facturables | **100%** | Reservas *External* confirmadas incluidas en el reporte mensual |
| Reservas creadas por la app vs. Forms | **100%** (Forms retirado) | Conteo de reservas por canal |
| Cancelaciones dentro de plazo (autoservicio) | **≥ 90%** | Cancelaciones con ≥2 días hábiles / total de cancelaciones |
| Ocupación de la sala (bloques AM/PM usados) | Línea base + tendencia | Bloques confirmados / bloques disponibles |

---

## §3 Usuarios objetivo

**Usuario primario:** **Solicitante** — persona de Siemens (interna DISW o de otra unidad) que
necesita reservar la sala 2C-1 para un entrenamiento.

**Perfil:**
- Contexto: entra desde un enlace (correo/intranet), sin necesidad de crear cuenta.
- Problema principal hoy: no sabe si la sala está libre y no recibe confirmación clara ni costo.
- Expectativa: ver disponibilidad, reservar en minutos y recibir confirmación por correo.

**Usuario secundario:** **Administrador de la sala** (rol de Edgar y equipo).
- Contexto: valida solicitudes, gestiona disponibilidad, configura precios y genera reportes.
- Problema hoy: opera manualmente por correo, sin tablero ni trazabilidad.
- Expectativa: una cola de validación, un calendario claro y reportes listos para finanzas.

**Usuario terciario (consumidor de salida):** **Finanzas.**
- No opera la app; **recibe el reporte mensual** con los datos completos para ejecutar el cobro por
  **movimiento ICC fuera del sistema**.

---

## §4 Scope del MVP

### Incluido en MVP:
- Formulario público de reserva (las 13 preguntas del Forms, reorganizadas y validadas).
- **Calendario de disponibilidad** por **bloques AM/PM** de la sala 2C-1, visible antes de reservar.
- Validación de solapamiento: **no se permite pre-reservar** si algún bloque ya está ocupado.
- Lógica **Internal (DISW) / External**: *External* obliga campos ARE (10–13) y **calcula costo**;
  *Internal* omite costo y campos ARE.
- **Cálculo de costo** automático (300 USD/día, 150 USD/medio día).
- Flujo de estados **Pendiente → Confirmada / Rechazada → Cancelada** con bloqueo de calendario
  desde la pre-reserva y validación del administrador.
- **Notificaciones por correo** (Microsoft Graph, buzón institucional) en cada transición, con
  archivo **.ics** adjunto en la confirmación.
- **Enlace único con token** para que el solicitante vea el estado y **cancele** (autoservicio) con
  regla de **≥ 2 días hábiles** (calendario laboral de México).
- **Módulo de administración** con login propio: cola de validación, calendario, configuración
  (precios, horarios de bloque, festivos, buzón, correo de reportes, administradores).
- **Export** de reporte (Excel/CSV) on-demand y **envío automático del reporte mensual** al correo
  designado por el administrador.
- **Bitácora de auditoría** de acciones administrativas.
- **Modelo de datos multi-sala/multi-sede** (aunque en el MVP solo opere 2C-1).
- Interfaz y correos en **español**.

### Explícitamente fuera del MVP:
- **SSO Azure AD** para solicitantes o administradores (se usa autodeclaración + login propio).
- **Alta y operación de salas adicionales** (MTY/QRO) desde la UI — el modelo lo soporta, pero la
  operación multi-sala se habilita en Fase 2.
- **Panel de finanzas** con seguimiento del cobro ICC (el sistema solo informa/reporta; no concilia).
- **Cobro/pasarela de pago** dentro del sistema (el cobro es ICC, fuera del sistema).
- **Gestión de recursos extra** (catering, proyectores adicionales) más allá del campo de
  "información adicional".
- **App móvil nativa** (la web será responsiva).

---

## §5 Épicas y funcionalidades

> Reglas de negocio transversales:
> - **Bloques:** cada día = **AM (08:00–13:00)** y **PM (13:00–18:00)**, configurables.
> - **Costo:** `total = bloques_reservados × 150 USD` → día completo (AM+PM) = 300 USD.
> - **Internal = DISW** → sin costo, sin campos ARE. **External** → costo + ARE (10–13) obligatorios.
> - **Cancelación autoservicio** permitida solo si faltan **≥ 2 días hábiles** (excluye sábados,
>   domingos y festivos oficiales de México).
> - El **calendario se bloquea desde la pre-reserva** (estado *Pendiente*).

### Épica 1: Reserva y disponibilidad (Solicitante)
**HU 1.1 — Ver disponibilidad:** Como solicitante, quiero ver un calendario con los bloques AM/PM
ocupados/libres de la sala 2C-1, para elegir fechas con disponibilidad real.
- Criterios de aceptación:
  - [ ] El calendario muestra, por día, el estado de los bloques **AM** y **PM** (libre/ocupado).
  - [ ] Los bloques ocupados corresponden a reservas en estado *Pendiente* o *Confirmada*.
  - [ ] Se puede navegar por mes; se resaltan fines de semana y festivos MX.

**HU 1.2 — Crear pre-reserva:** Como solicitante, quiero llenar el formulario (13 preguntas) y
enviar mi solicitud, para reservar la sala.
- Criterios de aceptación:
  - [ ] Se capturan las 13 preguntas del formulario (ver §Anexo A, mapeo de campos).
  - [ ] Al elegir *Half Day* debo seleccionar **AM o PM**; *Complete Day* toma ambos bloques.
  - [ ] Si selecciono *Internal (DISW)*, **no** se piden campos ARE ni se muestra costo.
  - [ ] Si selecciono *External*, los campos **ARE, ORG ID, GL Account, Cost Center** son obligatorios
        y se muestra el **costo estimado**.
  - [ ] Si **cualquier** bloque del rango elegido está ocupado, **no** se permite enviar y se indica
        el conflicto.
  - [ ] Al enviar con éxito, la reserva queda en estado **Pendiente**, se **bloquean los bloques** y
        recibo un correo con un **enlace único** para seguimiento.

**HU 1.3 — Seguimiento por enlace único:** Como solicitante, quiero un enlace en mi correo para ver
el estado de mi reserva sin crear cuenta.
- Criterios de aceptación:
  - [ ] El enlace contiene un **token** no adivinable y muestra el detalle y estado actual.
  - [ ] Desde ahí puedo **cancelar** si aplica la regla de ≥ 2 días hábiles (ver Épica 5).

### Épica 2: Validación y administración (Administrador)
**HU 2.1 — Login de administrador:** Como administrador, quiero iniciar sesión de forma segura para
acceder al módulo de administración.
- Criterios de aceptación:
  - [ ] Login con usuario/contraseña; contraseñas almacenadas con **hash** (bcrypt/argon2).
  - [ ] Sesión con expiración; soporte para **1 o más administradores**.

**HU 2.2 — Cola de validación:** Como administrador, quiero ver las pre-reservas *Pendientes* y
**confirmarlas o rechazarlas**, para controlar el uso de la sala.
- Criterios de aceptación:
  - [ ] Lista de *Pendientes* con todos los datos, tipo (Internal/External) y costo calculado.
  - [ ] **Confirmar** → estado *Confirmada*, se dispara correo al solicitante (con .ics y, si
        *External*, el **monto**).
  - [ ] **Rechazar** → estado *Rechazada* con **motivo**, se libera el calendario y se notifica.

**HU 2.3 — Calendario administrativo:** Como administrador, quiero un calendario con todas las
reservas por bloque, para tener visión de la ocupación.
- Criterios de aceptación:
  - [ ] Vista mensual con reservas por estado (color por estado).
  - [ ] Detalle al hacer clic; posibilidad de cancelar con registro en auditoría.

**HU 2.4 — Configuración:** Como administrador, quiero configurar precios, horarios de bloque,
festivos, buzón institucional, correo de reportes y administradores.
- Criterios de aceptación:
  - [ ] Editable: **precio día (300)**, **precio medio día (150)**, horarios AM/PM, antelación mínima,
        horizonte máximo.
  - [ ] Administración del **catálogo de festivos MX** (import/ediciones anuales).
  - [ ] Configuración del **correo de reportes mensuales** y del **buzón institucional** remitente.
  - [ ] Alta/baja de **administradores**.

### Épica 3: Costos y datos ARE
**HU 3.1 — Cálculo de costo:** Como sistema, quiero calcular el costo de las reservas *External*,
para informar el monto y reportarlo a finanzas.
- Criterios de aceptación:
  - [ ] `costo = bloques × 150 USD`; día completo = 300 USD; se recalcula si cambia el rango.
  - [ ] *Internal (DISW)* → costo **0** y **sin** campos ARE.
  - [ ] El monto se muestra al solicitante *External* y se incluye en la confirmación y el reporte.

### Épica 4: Notificaciones (Microsoft Graph)
**HU 4.1 — Correos transaccionales:** Como sistema, quiero enviar correos desde el buzón
institucional en cada transición de estado, para mantener informados a solicitante y administrador.
- Criterios de aceptación:
  - [ ] Envío vía **Microsoft Graph** desde el buzón institucional configurado.
  - [ ] Catálogo de correos según §Anexo C (creación, aviso a admin, confirmación con .ics, rechazo,
        cancelación).
  - [ ] Si Graph falla, se registra el error y se **reintenta**; la reserva no se pierde.

### Épica 5: Cancelación autoservicio
**HU 5.1 — Cancelar dentro de plazo:** Como solicitante, quiero cancelar mi reserva desde el enlace
único si faltan ≥ 2 días hábiles, para liberar la sala sin intervención del admin.
- Criterios de aceptación:
  - [ ] El botón de cancelar está **habilitado** solo si faltan **≥ 2 días hábiles** (excluye
        fin de semana y festivos MX) respecto a la fecha de inicio.
  - [ ] Dentro de los 2 días, el botón se **bloquea** con mensaje para **contactar al administrador**.
  - [ ] Al cancelar, se **liberan los bloques**, la reserva pasa a *Cancelada* y se envía correo de
        confirmación de cancelación.

### Épica 6: Reportes a finanzas
**HU 6.1 — Export on-demand:** Como administrador, quiero exportar un reporte (Excel/CSV) filtrando
por rango y estado, para enviarlo a finanzas cuando lo necesite.
- Criterios de aceptación:
  - [ ] Export incluye datos del solicitante, de la reserva, **campos ARE** y **costo total**.
  - [ ] Filtros por fecha y estado; solo reservas *External* aportan costo.

**HU 6.2 — Reporte mensual automático:** Como administrador, quiero que el sistema envíe
automáticamente el reporte del mes cerrado, para no depender de un envío manual.
- Criterios de aceptación:
  - [ ] Tras el cierre de mes (al inicio del mes siguiente), se envía el reporte del mes anterior al
        **correo designado** por el administrador.
  - [ ] El reporte contiene todas las reservas *External* confirmadas del periodo con su costo.
  - [ ] El envío se registra en auditoría.

### Épica 7: Gobernanza y auditoría
**HU 7.1 — Bitácora:** Como administrador, quiero un registro de acciones administrativas, para
trazabilidad.
- Criterios de aceptación:
  - [ ] Se registra quién y cuándo: validar, rechazar, cancelar, cambiar configuración, enviar reporte.

---

## §6 Arquitectura de alto nivel

```
┌───────────────────────────────────────────────┐
│   Navegador (Solicitante / Administrador)     │
│        HTML + JavaScript (SPA ligera)          │
└───────────────────┬───────────────────────────┘
                    │ HTTPS (REST/JSON)
┌───────────────────▼───────────────────────────┐
│           Backend — Node.js + Express          │
│  Reglas de negocio · estados · costo · auth    │
│  días hábiles/festivos · tokens de enlace      │
└───┬───────────────┬──────────────┬─────────────┘
    │               │              │
┌───▼──────────┐ ┌──▼───────────┐ ┌▼──────────────────────┐
│  Base de datos│ │ Microsoft    │ │  Microsoft Graph       │
│  SQLite → PG  │ │ Graph:       │ │  (calendario Outlook   │
│ (fuente de    │ │ enviar correo│ │  de la sala: bloqueos) │
│  verdad)      │ │ (buzón inst.)│ │                        │
└───────────────┘ └──────────────┘ └───────────────────────┘
```

- **Frontend:** HTML + JavaScript (vanilla o framework ligero), responsivo, en español.
- **Backend:** Node.js + Express. Contiene toda la lógica: validación de disponibilidad, máquina de
  estados, cálculo de costo, cálculo de días hábiles con festivos MX, generación de tokens de enlace,
  autenticación de administradores y orquestación de integraciones.
- **Base de datos:** **SQLite** para empezar (bajo costo/local), **migrable a PostgreSQL**. Es la
  **fuente de verdad** de la disponibilidad y de los datos de reserva.
- **Integraciones M365:** **Microsoft Graph** para (a) enviar correos desde el **buzón institucional**
  y (b) reflejar los bloqueos en el **calendario de Outlook de la sala** (la BD manda; Outlook es un
  espejo para visibilidad corporativa).

**Stack definido en:** [[03_Architecture/System_Design]] y `CLAUDE.md`.

---

## §7 No-funcionales

| Requisito | Descripción |
|-----------|-------------|
| Seguridad | Contraseñas de admin con **hash** (bcrypt/argon2); **tokens** de enlace no adivinables; **HTTPS** obligatorio; secretos (Graph, BD) solo en variables de entorno, nunca en el repo. |
| Privacidad / PII | Se almacena solo nombre y correo del solicitante + datos ARE; aviso de privacidad y política de **retención** alineados a Siemens; acceso a PII restringido a administradores. |
| Integridad de datos | La creación de reserva valida disponibilidad de forma **transaccional** para evitar doble reserva por concurrencia. |
| Disponibilidad | Objetivo de operación en horario laboral MX; reintentos ante fallos de Graph; la app no depende de Outlook para funcionar (Outlook es espejo). |
| Performance | Respuesta de consulta de disponibilidad y creación de reserva < 1 s en condiciones normales. |
| Internacionalización | Interfaz y correos en **español** (arquitectura preparada para i18n futura). |
| Auditoría | Bitácora inmutable de acciones administrativas. |
| Portabilidad | BD desacoplada (SQLite→PostgreSQL) mediante capa de acceso a datos. |

---

## §8 Riesgos principales

Ver [[09_Risk_Governance/Risk_Register]]. Riesgos destacados del proyecto:
- **Doble reserva por concurrencia** → validación transaccional de bloques.
- **Dependencia de Microsoft Graph / Outlook** (correo y calendario) → reintentos, colas y
  degradación elegante (la BD sigue siendo la fuente de verdad).
- **Cálculo incorrecto de días hábiles/festivos MX** → catálogo de festivos administrable y pruebas.
- **Manejo de PII** → minimización de datos, control de acceso, retención.
- **Cobro ICC fuera del sistema** → el sistema informa/reporta; la conciliación queda en finanzas.

---

## §9 Roadmap de fases

Ver [[07_Roadmap/Roadmap]].
- **Fase 1 — MVP:** sala 2C-1, flujo completo (reserva, validación, costo, notificaciones,
  cancelación, reportes), modelo de datos multi-sala.
- **Fase 2 — Multi-sala/sede:** operar MTY/QRO desde la UI, administradores por sala, recursos extra.
- **Fase 3 — SSO y analítica:** Azure AD (interno/externo automático), tableros de ocupación e
  ingresos, integración más profunda con finanzas.

---

## Anexo A — Mapeo de las 13 preguntas del formulario

| # | Pregunta (Forms) | Campo en la app | Notas |
|---|------------------|-----------------|-------|
| 1 | Event Name | `event_name` | Requerido |
| 2 | Contact Email address | `contact_email` | Requerido; destino de notificaciones y enlace único |
| 3 | Event Start Date | `start_date` | Requerido |
| 4 | End Event Date | `end_date` | Requerido; ≥ `start_date` |
| 5 | Duration (Half/Complete Day) | `duration_type` + `half_block` | Si *Half* → elegir **AM/PM** |
| 6 | Total Duration in Days | `total_days` | Derivado/validado contra el rango de fechas |
| 7 | Rental Type (Internal/External) | `rental_type` | **Internal = DISW** (sin costo/ARE); **External** (costo + ARE) |
| 8 | Room Site (CDMX/MTY/QRO) | `room_id` | MVP fijo **2C-1 / CDMX**; persistido para multi-sala |
| 9 | Additional Information | `notes` | Opcional |
| 10 | Provide ARE | `are` | **Solo External** (obligatorio) |
| 11 | Provide ORG ID | `org_id` | **Solo External** (obligatorio) |
| 12 | Provide GL Account | `gl_account` | **Solo External** (obligatorio) |
| 13 | Provide Cost Center | `cost_center` | **Solo External** (obligatorio) |

---

## Anexo B — Máquina de estados de la reserva

```
                 crea pre-reserva (bloquea bloques)
   [Nueva] ───────────────────────────────────►  PENDIENTE
                                                   │  │
                          admin confirma           │  │  admin rechaza (motivo)
                 ┌─────────────────────────────────┘  └───────────────────────┐
                 ▼                                                             ▼
             CONFIRMADA                                                    RECHAZADA
                 │                                                     (libera bloques)
                 │  cancelación autoservicio (≥2 días hábiles)
                 │  o cancelación por admin
                 ▼
             CANCELADA  (libera bloques)
```

- **PENDIENTE:** bloquea bloques; correo al solicitante + aviso al admin.
- **CONFIRMADA:** correo con detalle, **.ics** y (si *External*) **monto**.
- **RECHAZADA / CANCELADA:** libera bloques; correo de notificación.

---

## Anexo C — Catálogo de correos (buzón institucional vía Graph)

| Evento (disparador) | Destinatario | Asunto (ejemplo) | Contenido clave |
|---------------------|--------------|------------------|-----------------|
| Pre-reserva creada | Solicitante | "Recibimos tu solicitud de reserva — Sala 2C-1" | Detalle, estado *Pendiente*, **enlace único** |
| Pre-reserva creada | Administrador | "Nueva pre-reserva pendiente de validar" | Detalle, tipo, costo, link a la cola de validación |
| Reserva confirmada | Solicitante | "Tu reserva de la Sala 2C-1 está confirmada" | Detalle, **.ics**, monto (si *External*), enlace único |
| Reserva rechazada | Solicitante | "Tu solicitud de la Sala 2C-1 no fue aprobada" | **Motivo** del rechazo |
| Reserva cancelada | Solicitante | "Cancelación confirmada — Sala 2C-1" | Confirmación, fecha/hora de cancelación |
| Reporte mensual | Correo designado por admin | "Reporte de rentas Sala 2C-1 — <mes>" | Adjunto Excel/CSV con reservas *External* del mes |

---

## Anexo D — Modelo de datos (multi-sala)

| Tabla | Campos clave | Propósito |
|-------|--------------|-----------|
| `rooms` | id, código (2C-1), sede (CDMX/MTY/QRO), activa | Catálogo de salas (multi-sala) |
| `reservations` | id, room_id, event_name, contact_email, start_date, end_date, rental_type, total_days, notes, are, org_id, gl_account, cost_center, cost_usd, status, token, created_at | Reserva y sus 13 datos + estado + costo |
| `blocks` | id, room_id, date, slot (AM/PM), reservation_id | Bloqueo de disponibilidad (fuente de verdad anti-solapamiento) |
| `admins` | id, usuario, password_hash, activo | Administradores |
| `config` | precio_dia, precio_medio, horario_am, horario_pm, buzon, correo_reportes, antelacion_min, horizonte_max | Parámetros configurables |
| `holidays` | fecha, descripción | Festivos MX para cálculo de días hábiles |
| `audit_log` | id, admin_id, acción, entidad, timestamp, detalle | Auditoría de acciones administrativas |

---

## Anexo E — Reglas de cálculo

**Costo:**
```
bloques = Σ (por cada día del rango) { 2 si Complete Day, 1 si Half Day }
costo_usd = (rental_type == External) ? bloques × 150 : 0
```

**Días hábiles (para la regla de cancelación ≥ 2):**
```
Se cuentan los días entre HOY y start_date excluyendo sábados, domingos
y fechas presentes en `holidays` (festivos oficiales de México).
Cancelación autoservicio permitida  ⇔  días_hábiles(HOY, start_date) ≥ 2
```
