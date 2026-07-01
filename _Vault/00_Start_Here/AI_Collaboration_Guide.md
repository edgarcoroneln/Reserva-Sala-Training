---
project: "{{PROJECT_NAME}}"
---

# Guía de Colaboración con IA — {{PROJECT_NAME}}

## Cómo trabajar con Claude Code en este proyecto

### Antes de cada sesión
1. Lee [[00_Start_Here/Current_Build_Target]] — ¿qué construimos hoy?
2. Lee la última entrada del [[DevLog/DevLog_Index]]
3. Abre el `CLAUDE.md` del proyecto para contexto de stack y convenciones

### Prompt de inicio recomendado

```
Lee CLAUDE.md y _Vault/00_Start_Here/Current_Build_Target.md antes de empezar.

Hoy necesito: (describe la tarea en 1-2 líneas)

Contexto adicional: (menciona el último DevLog si es relevante)
```

### Reglas de oro para sesiones de IA

| Regla | Por qué |
|-------|---------|
| Una tarea a la vez | Evita que la IA introduzca cambios fuera de scope |
| Revisa el diff antes de commitear | La IA puede modificar más de lo pedido |
| DevLog antes del push | Trazabilidad de decisiones |
| Nunca commitear secrets | El `.gitignore` los excluye, pero verifica |
| Ramas por feature | `feat/login`, `fix/api-error`, nunca directo a `main` |

### Al finalizar cada sesión

Crea una entrada en [[DevLog/DevLog_Index]] con:
- Qué se hizo
- Qué decidió la IA de forma autónoma
- Qué corregiste manualmente
- Próximos pasos

### Agentes de IA disponibles
- **Claude Code** — implementación, refactoring, debugging
- **Claude (chat)** — diseño, arquitectura, revisión de PRD
- Documenta qué agente usaste en cada DevLog entry

---

## Estándar de DevLog

Cada sesión significativa con IA genera un archivo:
`DevLog/YYYY-MM-DD-descripcion.md`

Template: ver [[DevLog/DevLog_Index]]
