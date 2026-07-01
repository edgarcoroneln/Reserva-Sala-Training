---
project: "{{PROJECT_NAME}}"
---

# Engineering Workflow — {{PROJECT_NAME}}

## Flujo de trabajo estándar

```
main (producción)
  ↑
  └── feat/nombre-feature   ← trabajas aquí
        ↓
      PR → merge → main → CI/CD → deploy automático
```

### Paso a paso para cada feature

```bash
# 1. Partir siempre de main actualizado
git checkout main
git pull origin main

# 2. Crear rama
git checkout -b feat/nombre-descripcion

# 3. Desarrollar (sesiones con IA, commits frecuentes)
git add <archivos>
git commit -m "feat(scope): descripción"

# 4. Push
git push origin feat/nombre-descripcion

# 5. Crear PR en GitHub (aunque seas tú solo)
# El PR es tu registro de qué cambió y por qué

# 6. Merge y limpiar
git checkout main
git pull origin main
git branch -d feat/nombre-descripcion
```

---

## Convenciones de commits

Formato: `type(scope): descripción en minúsculas`

| Type | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `refactor` | Refactoring sin cambio de comportamiento |
| `test` | Tests nuevos o correcciones |
| `chore` | Configuración, dependencias, setup |
| `style` | Formato, espacios (sin cambio de lógica) |

**Ejemplos:**
```
feat(auth): add Google OAuth login
fix(api): handle 404 when user not found
docs(vault): update current build target
refactor(feed): extract scoring logic to utils
```

---

## Ramas

| Prefijo | Uso |
|---------|-----|
| `feat/` | Nueva funcionalidad |
| `fix/` | Corrección de bug |
| `docs/` | Solo documentación |
| `chore/` | Setup, config, dependencias |
| `hotfix/` | Fix urgente directo desde main |

**Nunca pusheamos directo a `main`.** Siempre PR, aunque seamos nosotros mismos.

---

## Sesiones de trabajo con IA

Ver [[00_Start_Here/AI_Collaboration_Guide]] para el protocolo completo.

**Regla de oro:** Una sesión = un objetivo claro. No mezclar features en la misma sesión.

---

## CI/CD

El pipeline en `.github/workflows/deploy.yml` se dispara en cada push a `main`:
1. Instala dependencias
2. Corre tests
3. Build
4. Deploy al ambiente de producción

**Si el pipeline falla:** no se hace deploy. Investiga en GitHub Actions → tab "Actions".
