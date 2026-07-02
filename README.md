# Reserva Sala de Entrenamiento 2C-1

App web que reemplaza el Microsoft Form para reservar la sala de entrenamientos **2C-1** de DISW
(2 Patios, CDMX): valida disponibilidad por bloques **AM/PM**, aplica el costo de renta a unidades
ajenas a DISW y da seguimiento por token. Documentación completa en [`_Vault/01_Product/PRD.md`](_Vault/01_Product/PRD.md).

- **Stack:** HTML + JavaScript · Node.js + Express · SQLite (→ PostgreSQL) · (integración Microsoft Graph pendiente)
- **Estado:** MVP completo (rebanadas 1–5) — reserva, disponibilidad, administración, **notificaciones por correo**, **cancelación autoservicio** y **reportes a finanzas**.

## Cómo correr la app (MVP)

Requiere **Node.js ≥ 22.5** (usa el SQLite integrado de Node).

```bash
npm install        # instala dependencias (express)
npm start          # inicia el servidor en http://localhost:3000
npm test           # corre la suite de pruebas (node --test)
npm run dev        # modo watch para desarrollo
```

Variables de entorno (ver [`.env.example`](.env.example)): `PORT`, `DB_PATH`,
`ADMIN_USER` / `ADMIN_PASSWORD` (admin inicial), `REPORT_EMAIL` / `ADMIN_NOTIFY_EMAIL` (correos),
`MAIL_TRANSPORT` (`console` por defecto o `graph`) y las `GRAPH_*` para Microsoft Graph.

> **Correo local sin credenciales:** con `MAIL_TRANSPORT=console` (default) los correos NO se envían;
> se registran en la tabla `emails` y en la consola, así puedes probar todo el flujo sin Microsoft
> Graph. Para envío real, define `MAIL_TRANSPORT=graph` y las variables `GRAPH_*`.

### Módulo de administración

- URL: **http://localhost:3000/admin.html** (enlace "Administración" en la esquina superior de la app).
- Al primer arranque se crea un admin por defecto: **usuario `admin` / contraseña `admin123`**
  (cámbialo con `ADMIN_USER` / `ADMIN_PASSWORD`). La sesión usa cookie httpOnly.

### Endpoints

**Públicos**

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/room` | Datos de la sala y tarifas/turnos |
| GET | `/api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` | Bloques ocupados en el rango |
| POST | `/api/reservations` | Crea una pre-reserva (201 / 400 / 409) |
| GET | `/api/reservations/:token` | Consulta una reserva + elegibilidad de cancelación |
| POST | `/api/reservations/:token/cancel` | Cancelación autoservicio (≥ 5 días hábiles / 1 semana) |

**Administración** (requieren sesión)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/login` · `/api/admin/logout` | Inicia / cierra sesión |
| GET | `/api/admin/me` | Admin de la sesión actual |
| GET | `/api/admin/reservations?status=` | Listado + conteos por estado |
| POST | `/api/admin/reservations/:id/confirm` | Confirma una pendiente (notifica) |
| POST | `/api/admin/reservations/:id/reject` | Rechaza (con motivo), libera calendario y notifica |
| POST | `/api/admin/reservations/:id/cancel` | Cancela una confirmada, libera calendario y notifica |
| GET · PUT | `/api/admin/settings` | Lee / actualiza el correo de reportes y de avisos |
| GET | `/api/admin/reports/reservations.csv` | Export CSV (filtros `from`/`to`/`status`) |
| GET | `/api/admin/reports/monthly.csv?month=YYYY-MM` | CSV facturable del mes |
| POST | `/api/admin/reports/monthly/send` | Envía el reporte mensual por correo |

El **reporte mensual** (External confirmadas) se envía **automáticamente** al inicio de cada mes al
`REPORT_EMAIL` configurado. Documentación funcional completa en
[`_Vault/01_Product/PRD.md`](_Vault/01_Product/PRD.md).

---

<details>
<summary>Documentación del template base (Vault de Obsidian, setup scripts)</summary>

Este proyecto se generó a partir de un template estándar con:
- **Vault de Obsidian** integrado (documentación, Kanban, DevLog)
- **GitHub Actions** CI/CD (configurable por stack)
- **CLAUDE.md** para colaboración con IA (Claude Code)
- **Setup script** para inicializar proyectos nuevos en segundos

---

## Uso como GitHub Template

1. En GitHub, haz clic en **"Use this template"** → "Create a new repository"
2. Clona tu nuevo repo localmente
3. Ejecuta el script de setup:

```powershell
# Windows
.\setup.ps1

# macOS / Linux
bash setup.sh
```

4. El script te pide nombre, descripción, stack y personaliza todos los archivos
5. Abre Obsidian → **"Open folder as vault"** → selecciona la carpeta `_Vault/`
6. Instala el plugin **Obsidian Kanban** (Settings → Community plugins → Browse → "Kanban")

---

## Estructura del template

```
project-dev-template/
├── _Vault/                    ← Abre esto como Vault en Obsidian
│   ├── .obsidian/             ← Config de Obsidian (plugins, settings)
│   ├── 00_Start_Here/         ← Índice, build target actual, guía de IA
│   ├── 01_Product/            ← PRD
│   ├── 02_Requirements/       ← User Stories
│   ├── 03_Architecture/       ← System Design, API Spec
│   ├── 04_UX_Design/          ← Screen Specs
│   ├── 05_Engineering/        ← Workflow, Definition of Done
│   ├── 06_QA_Validation/      ← Test Plan
│   ├── 07_Roadmap/            ← Fases del proyecto
│   ├── 08_Release/            ← Deployment Guide
│   ├── 09_Risk_Governance/    ← Risk Register
│   ├── DevLog/                ← Registro de sesiones con IA
│   ├── Sprint-1/              ← Overview y daily log del sprint
│   └── Kanban/                ← Sprint Board + Backlog (Obsidian Kanban)
├── .github/
│   ├── workflows/deploy.yml   ← CI/CD (configura tu plataforma aquí)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── CLAUDE.md                  ← Contexto del proyecto para Claude Code
├── .gitignore                 ← Universal (Node, Python, Mobile, secrets)
├── setup.ps1                  ← Setup script para Windows
└── setup.sh                   ← Setup script para macOS / Linux
```

---

## Flujo de trabajo estándar

```
1. Abre _Vault/ en Obsidian
2. Revisa Sprint_Board.md (Kanban) — ¿qué toca hoy?
3. Actualiza Current_Build_Target.md
4. Abre Claude Code en la raíz del proyecto
5. Desarrolla con IA (una tarea a la vez)
6. Antes del push: crea entrada en DevLog/
7. PR → merge → CI/CD → deploy automático
```

---

## Placeholders

El setup script reemplaza estos valores automáticamente:

| Placeholder | Descripción |
|-------------|-------------|
| `{{PROJECT_NAME}}` | Nombre del proyecto |
| `{{DESCRIPTION}}` | Descripción corta |
| `{{DEVELOPER_NAME}}` | Tu nombre |
| `{{REPO_URL}}` | URL del repo en GitHub |
| `{{STACK}}` | Stack tecnológico elegido |
| `{{PROJECT_TYPE}}` | web-app / api / mobile / script |
| `{{DATE}}` | Fecha de inicialización |

---

## Plugins recomendados para Obsidian

| Plugin | Para qué | Instalación |
|--------|----------|-------------|
| **Obsidian Kanban** | Sprint Board y Backlog visual | Community plugins → "Kanban" |
| **Obsidian Git** | Sync con GitHub desde Obsidian (opcional) | Community plugins → "Obsidian Git" |

---

Basado en las buenas prácticas del proyecto **recos-BnM** (2026).

</details>
