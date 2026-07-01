---
project: "{{PROJECT_NAME}}"
version: "1.0"
status: "Draft"
updated: "{{DATE}}"
---

# PRD — {{PROJECT_NAME}}

## §1 Contexto y problema

**¿Qué problema resuelve este proyecto?**

(Describe el problema en 2-3 párrafos. Quién lo tiene, cuándo ocurre, qué pasa si no se resuelve.)

---

## §2 Visión y North Star

**Visión:** (Una frase que describe el estado ideal del mundo con este producto)

**North Star Metric:** (La métrica más importante. Ej: "usuarios activos semanales", "transacciones completadas/día")

**Métricas de éxito del MVP:**
| Métrica | Target | Cómo medir |
|---------|--------|------------|
| (métrica 1) | (valor) | (método) |
| (métrica 2) | (valor) | (método) |

---

## §3 Usuarios objetivo

**Usuario primario:** (Nombre del tipo de usuario, descripción en 1 línea)

**Perfil:**
- Contexto: (cuándo usa la app, desde dónde)
- Problema principal: (qué frustra a este usuario hoy)
- Expectativa: (qué espera que haga la app)

---

## §4 Scope del MVP

### Incluido en MVP:
- (Feature 1)
- (Feature 2)
- (Feature 3)

### Explícitamente fuera del MVP:
- (Feature que se omite y por qué)
- (Optimización para fase 2)

---

## §5 Épicas y funcionalidades

### Épica 1: (Nombre)
**HU 1.1 — (Nombre):** Como (usuario), quiero (acción) para (beneficio).
- Criterios de aceptación:
  - [ ] (criterio 1)
  - [ ] (criterio 2)

### Épica 2: (Nombre)
**HU 2.1 — (Nombre):** Como (usuario), quiero (acción) para (beneficio).
- Criterios de aceptación:
  - [ ] (criterio 1)

---

## §6 Arquitectura de alto nivel

```
(Diagrama ASCII o descripción del sistema)

[Frontend] → [API] → [Base de datos]
     ↓
[Servicio externo]
```

**Stack definido en:** `CLAUDE.md`

---

## §7 No-funcionales

| Requisito | Descripción |
|-----------|-------------|
| Performance | (ej: respuesta < 500ms en p95) |
| Seguridad | (ej: auth JWT, HTTPS obligatorio) |
| Disponibilidad | (ej: 99% uptime) |
| Offline | (ej: PWA con cache local) |

---

## §8 Riesgos principales

Ver [[09_Risk_Governance/Risk_Register]]

---

## §9 Roadmap de fases

Ver [[07_Roadmap/Roadmap]]
