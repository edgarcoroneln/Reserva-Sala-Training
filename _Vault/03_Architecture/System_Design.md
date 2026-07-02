---
project: "Reserva Sala de Entrenamiento 2C-1"
stack: "HTML + JavaScript / Node.js + Express / SQLite→PostgreSQL / Microsoft Graph"
updated: "2026-07-02"
---

# Diseño del Sistema — Reserva Sala de Entrenamiento 2C-1

## Diagrama de arquitectura

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

> La **base de datos es la única fuente de verdad** de la disponibilidad. El calendario de Outlook
> es un **espejo** para visibilidad corporativa; la app funciona aunque Outlook no esté disponible.

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | HTML + JavaScript (vanilla o framework ligero) | Requisito de simplicidad; responsivo y en español |
| Backend | Node.js + Express | Backend ligero, ecosistema Graph maduro (SDK JS) |
| Base de datos | SQLite → PostgreSQL | Arranque simple y local; migrable a PG al escalar |
| Auth (admin) | Login propio (sesión + hash bcrypt/argon2) | Sin dependencia de Azure AD en el MVP |
| Acceso usuario | Formulario abierto + token de enlace único | Sin fricción; habilita seguimiento y cancelación |
| Integraciones | Microsoft Graph (correo + calendario) | Buzón institucional y calendario de la sala en M365 |
| Deploy | Servidor propio (HTTPS) + GitHub Actions | Hospedaje pedido; CI/CD ya presente en el repo |

---

## Decisiones de arquitectura

| Decisión | Alternativas consideradas | Razón elegida | Fecha |
|----------|--------------------------|---------------|-------|
| Backend propio + BD como fuente de verdad | Todo en M365 (SharePoint/Dataverse); solo frontend + Firebase | Control del flujo, reportes financieros confiables, concurrencia | 2026-07-02 |
| Autodeclaración + validación admin (DISW/External) | SSO Azure AD; inferencia por dominio | Simplicidad de MVP sin registrar app en Azure AD | 2026-07-02 |
| Disponibilidad por bloques AM/PM | Día completo indivisible; solo rango de fechas | Máxima utilización de la sala; medios días compartibles | 2026-07-02 |
| Modelo de datos multi-sala desde el MVP | Hardcodear una sola sala | Escalar a MTY/QRO sin re-trabajo | 2026-07-02 |
| SQLite → PostgreSQL | PostgreSQL desde el día 1 | Menor fricción inicial; capa de datos desacoplada | 2026-07-02 |

---

## Flujo de datos principal (crear pre-reserva)

```
1. El solicitante consulta disponibilidad         → GET /api/availability?room&month
2. Llena el formulario (13 preguntas) y envía      → POST /api/reservations
3. Backend valida: fechas, ARE si External,
   y disponibilidad de bloques (transaccional)
4. Se escribe la reserva (Pendiente) + bloques,
   se genera token de enlace único
5. Se refleja el bloqueo en Outlook (Graph) y
   se envían correos (solicitante + admin) vía Graph
6. Respuesta: reserva creada + enlace de seguimiento
```

Transiciones posteriores (`Confirmada/Rechazada/Cancelada`) siguen la máquina de estados del
Anexo B del [[01_Product/PRD]], liberando o manteniendo bloques y disparando los correos del Anexo C.

---

## Configuración de entornos

| Entorno | URL | Base de datos | Notas |
|---------|-----|---------------|-------|
| Local | localhost | SQLite local | Usar `.env.local`; Graph en modo sandbox/mock |
| Staging | (URL) | SQLite/PG de staging | QA previo a prod |
| Producción | (URL) | PostgreSQL | Solo deploy vía CI; secretos en variables de entorno |

---

## Seguridad

- **Auth admin:** sesión segura + contraseñas con hash (bcrypt/argon2).
- **Enlaces de usuario:** tokens no adivinables por reserva.
- **Secrets:** credenciales de Graph y BD en variables de entorno; nunca en el repo.
- **HTTPS:** obligatorio en todos los ambientes.
- **PII:** minimización (solo nombre/correo + datos ARE), acceso restringido, retención definida.
- Ver [[09_Risk_Governance/Risk_Register]] para riesgos de seguridad.
