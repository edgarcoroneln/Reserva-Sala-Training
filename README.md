# project-dev-template

Template estándar para proyectos de desarrollo personal con:
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
