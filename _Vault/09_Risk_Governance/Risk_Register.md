---
project: "{{PROJECT_NAME}}"
updated: "{{DATE}}"
---

# Risk Register — {{PROJECT_NAME}}

> Riesgos identificados, su severidad y plan de mitigación.

---

## Riesgos activos

| ID | Riesgo | Severidad | Probabilidad | Mitigación | Estado |
|----|--------|-----------|-------------|------------|--------|
| R01 | Secret/API key comprometida | 🔴 Crítico | Baja | `.gitignore` estricto, variables de entorno, nunca hardcodear | Activo |
| R02 | Deuda técnica por over-engineering de IA | 🟠 Alto | Media | Revisar diff antes de commitear, scope claro por sesión | Activo |
| R03 | Dependencia de servicio externo sin fallback | 🟠 Alto | Media | Documentar dependencias en System_Design, agregar manejo de errores | Activo |
| R04 | Pérdida de contexto entre sesiones de IA | 🟡 Medio | Alta | DevLog obligatorio, CLAUDE.md actualizado, Current_Build_Target | Activo |
| R05 | Deploy roto sin reverting plan | 🟡 Medio | Baja | CI/CD con tests, rama `main` protegida, tags de release | Activo |

---

## Cómo agregar un riesgo

Cuando identifiques un riesgo nuevo:
1. Dale un ID secuencial (R06, R07, etc.)
2. Evalúa severidad: 🔴 Crítico / 🟠 Alto / 🟡 Medio / 🟢 Bajo
3. Define la mitigación antes de que el riesgo se materialice
4. Cambia el estado a **Resuelto** cuando esté mitigado

---

## Riesgos resueltos

| ID | Riesgo | Cómo se resolvió | Fecha |
|----|--------|-----------------|-------|
| (mover aquí cuando se resuelvan) | | | |
