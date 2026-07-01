---
project: "{{PROJECT_NAME}}"
updated: "{{DATE}}"
---

# API Specification — {{PROJECT_NAME}}

> Contratos de todos los endpoints del proyecto.
> Formato: Request / Response / Errores posibles.

---

## Base URL

- **Local:** `http://localhost:3001`
- **Producción:** `(URL del backend desplegado)`

## Autenticación

Todos los endpoints protegidos requieren:
```
Authorization: Bearer <token>
```

---

## Endpoints

### GET /api/health
**Descripción:** Health check del servidor
**Auth requerida:** No

**Response 200:**
```json
{ "ok": true }
```

---

### GET /api/(recurso)
**Descripción:** (qué devuelve)
**Auth requerida:** Sí

**Query params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| (param) | string | No | (descripción) |

**Response 200:**
```json
{
  "items": [],
  "cursor": null
}
```

**Errores:**
| Código | Motivo |
|--------|--------|
| 401 | Token inválido o ausente |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

---

### POST /api/(recurso)
**Descripción:** (qué crea o hace)
**Auth requerida:** Sí

**Body:**
```json
{
  "campo1": "string",
  "campo2": "number"
}
```

**Response 201:**
```json
{
  "id": "abc123",
  "campo1": "valor"
}
```

**Errores:**
| Código | Motivo |
|--------|--------|
| 400 | Body inválido o campos faltantes |
| 401 | Token inválido |
| 409 | Recurso ya existe |

---

## Modelo de datos

Ver [[03_Architecture/System_Design]] para el modelo completo.

### (NombreDelModelo)
```typescript
{
  id: string
  campo1: string
  campo2: number
  createdAt: timestamp
  updatedAt: timestamp
}
```
