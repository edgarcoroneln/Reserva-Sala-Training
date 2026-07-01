---
project: "{{PROJECT_NAME}}"
stack: "{{STACK}}"
updated: "{{DATE}}"
---

# Diseño del Sistema — {{PROJECT_NAME}}

## Diagrama de arquitectura

```
(Reemplaza con tu arquitectura real)

┌─────────────────────────────────────────────┐
│                  Cliente                     │
│         (Browser / Mobile App)               │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│               Backend / API                  │
│            (Node.js / Python)                │
└───────────┬──────────────┬───────────────────┘
            │              │
┌───────────▼───┐  ┌───────▼──────────────────┐
│  Base de datos│  │  Servicios externos       │
│  (DB / Cloud) │  │  (APIs, Auth, Storage)    │
└───────────────┘  └──────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | (ej: React + Vite) | (razón) |
| Backend | (ej: Node.js + Express) | (razón) |
| Base de datos | (ej: Firestore / PostgreSQL) | (razón) |
| Auth | (ej: Firebase Auth / JWT) | (razón) |
| Deploy | (ej: Firebase Hosting / Vercel) | (razón) |
| CI/CD | GitHub Actions | Automatización de deploy |

---

## Decisiones de arquitectura

| Decisión | Alternativas consideradas | Razón elegida | Fecha |
|----------|--------------------------|---------------|-------|
| (ej: Firebase vs PostgreSQL) | (alternativas) | (razón) | {{DATE}} |

---

## Flujo de datos principal

```
1. Usuario hace (acción)
2. Frontend llama a (endpoint)
3. Backend valida (qué)
4. Se escribe/lee en (base de datos)
5. Respuesta: (formato)
```

---

## Configuración de entornos

| Entorno | URL | Base de datos | Notas |
|---------|-----|---------------|-------|
| Local | localhost | Emulador / local DB | Usar `.env.local` |
| Staging | (URL) | DB de staging | Para QA previo a prod |
| Producción | (URL) | DB de prod | Solo deploy vía CI |

---

## Seguridad

- Auth: (método usado)
- Secrets: Variables de entorno, nunca en código
- HTTPS: Obligatorio en todos los ambientes
- Ver [[09_Risk_Governance/Risk_Register]] para riesgos de seguridad
