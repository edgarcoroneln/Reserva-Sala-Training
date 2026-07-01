---
project: "{{PROJECT_NAME}}"
---

# Definition of Done — {{PROJECT_NAME}}

> Una tarea está **DONE** cuando cumple TODOS estos criterios.
> No hay excepciones. Si algo no aplica, justifícalo en el PR.

---

## Checklist obligatorio

### Código
- [ ] La funcionalidad implementada pasa todos los criterios de aceptación de la HU
- [ ] El código compila y el servidor levanta sin errores
- [ ] No hay `console.log` de debugging olvidados en producción
- [ ] No hay secrets, API keys o tokens hardcodeados en el código

### Tests
- [ ] Tests escritos para el happy path
- [ ] Tests escritos para al menos 1 caso borde o de error
- [ ] Todos los tests existentes siguen pasando (`npm test` / `pytest` verde)
- [ ] CI en GitHub Actions pasa (verde)

### Documentación
- [ ] **DevLog actualizado** antes del push (`_Vault/DevLog/YYYY-MM-DD-descripcion.md`)
- [ ] `_Vault/00_Start_Here/Current_Build_Target.md` refleja el estado actual
- [ ] Si se creó un endpoint nuevo → documentado en [[03_Architecture/API_Specification]]
- [ ] Si se tomó una decisión arquitectónica → registrada en [[03_Architecture/System_Design]]

### Git
- [ ] El trabajo está en una rama feature (`feat/`, `fix/`, `docs/`)
- [ ] Commits con mensajes descriptivos (`feat(auth): add JWT validation`)
- [ ] PR creado y mergeado a `main` (aunque seas tú solo quien lo aprueba)
- [ ] Rama feature eliminada después del merge

### Calidad
- [ ] El código fue revisado (aunque sea por ti mismo, como una segunda lectura)
- [ ] El cambio no rompe funcionalidad existente (smoke test manual)
- [ ] La IA no introdujo código fuera del scope de la tarea

---

## DevLog — requisito mínimo

Todo trabajo significativo con IA requiere una entrada en el DevLog. Usa este template:

```markdown
---
project: "{{PROJECT_NAME}}"
date: "YYYY-MM-DD"
author_human: "{{DEVELOPER_NAME}}"
agent: "Claude Code"
model: "claude-sonnet-4-6"
session_duration: "1h"
tags: [devlog, sprint-1]
---

# DevLog — YYYY-MM-DD — Descripción

## Qué se hizo
- (lista de cambios)

## Decisiones autónomas del agente
- (qué decidió la IA sin que tú lo pidieras)

## Correcciones manuales
- (qué tuviste que arreglar después)

## Próximos pasos
- (qué sigue)
```
