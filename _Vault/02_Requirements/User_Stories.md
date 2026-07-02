---
project: "Reserva Sala de Entrenamiento 2C-1"
updated: "2026-07-02"
---

# User Stories — Reserva Sala de Entrenamiento 2C-1

> Todas las historias de usuario del proyecto, organizadas por épica.
> Ver el PRD completo en [[01_Product/PRD]] (§5) y las reglas de negocio ahí descritas.

---

## Épica 1: Reserva y disponibilidad (Solicitante)

### HU 1.1 — Ver disponibilidad
**Como** solicitante
**Quiero** ver un calendario con los bloques AM/PM ocupados/libres de la sala 2C-1
**Para** elegir fechas con disponibilidad real

**Criterios de aceptación:**
- [ ] El calendario muestra, por día, el estado de los bloques **AM** y **PM**
- [ ] Los bloques ocupados corresponden a reservas *Pendiente* o *Confirmada*
- [ ] Se resaltan fines de semana y festivos MX

### HU 1.2 — Crear pre-reserva
**Como** solicitante
**Quiero** llenar el formulario (13 preguntas) y enviar mi solicitud
**Para** reservar la sala

**Criterios de aceptación:**
- [ ] Se capturan las 13 preguntas (ver Anexo A del PRD)
- [ ] *Half Day* exige elegir **AM/PM**; *Complete Day* toma ambos bloques
- [ ] *Internal (DISW)* → sin campos ARE ni costo; *External* → ARE obligatorios + costo visible
- [ ] Si algún bloque está ocupado, **no** se permite enviar
- [ ] Al enviar, la reserva queda **Pendiente**, se bloquean bloques y llega correo con enlace único

### HU 1.3 — Seguimiento por enlace único
**Como** solicitante
**Quiero** un enlace en mi correo para ver el estado de mi reserva sin crear cuenta
**Para** dar seguimiento y cancelar si aplica

**Criterios de aceptación:**
- [ ] El enlace usa un **token** no adivinable y muestra detalle + estado
- [ ] Permite cancelar según la regla de ≥ 5 días hábiles / 1 semana (Épica 5)

---

## Épica 2: Validación y administración (Administrador)

### HU 2.1 — Login de administrador
**Como** administrador
**Quiero** iniciar sesión de forma segura
**Para** acceder al módulo de administración

**Criterios de aceptación:**
- [ ] Contraseñas con **hash**; sesión con expiración; soporte 1+ administradores

### HU 2.2 — Cola de validación
**Como** administrador
**Quiero** confirmar o rechazar las pre-reservas *Pendientes*
**Para** controlar el uso de la sala

**Criterios de aceptación:**
- [ ] Lista de pendientes con datos, tipo y costo
- [ ] **Confirmar** → correo al solicitante (con .ics y monto si *External*)
- [ ] **Rechazar** → estado *Rechazada* con motivo, libera calendario y notifica

### HU 2.3 — Calendario administrativo
**Como** administrador
**Quiero** ver todas las reservas por bloque en un calendario
**Para** tener visión de la ocupación

**Criterios de aceptación:**
- [ ] Vista mensual con color por estado y detalle al hacer clic

### HU 2.4 — Configuración
**Como** administrador
**Quiero** configurar precios, horarios de bloque, festivos, buzón, correo de reportes y admins
**Para** operar la sala sin tocar código

**Criterios de aceptación:**
- [ ] Editable: precio día (300), medio día (150), horarios AM/PM, antelación, horizonte
- [ ] Gestión de festivos MX y del correo de reportes mensuales
- [ ] Alta/baja de administradores

---

## Épica 3: Costos y datos ARE

### HU 3.1 — Cálculo de costo
**Como** sistema
**Quiero** calcular el costo de reservas *External*
**Para** informar el monto y reportarlo a finanzas

**Criterios de aceptación:**
- [ ] `costo = bloques × 150 USD`; día completo = 300 USD
- [ ] *Internal (DISW)* → costo 0 y sin campos ARE

---

## Épica 4: Notificaciones (Microsoft Graph)

### HU 4.1 — Correos transaccionales
**Como** sistema
**Quiero** enviar correos desde el buzón institucional en cada transición
**Para** mantener informados a solicitante y administrador

**Criterios de aceptación:**
- [ ] Envío vía Graph; catálogo de correos según Anexo C del PRD
- [ ] Reintento ante fallo; la reserva no se pierde

---

## Épica 5: Cancelación autoservicio

### HU 5.1 — Cancelar dentro de plazo
**Como** solicitante
**Quiero** cancelar desde el enlace único si faltan ≥ 5 días hábiles (1 semana)
**Para** liberar la sala sin intervención del admin

**Criterios de aceptación:**
- [ ] Botón habilitado solo con ≥ 5 días hábiles / 1 semana (excluye fin de semana y festivos MX)
- [ ] Con menos de 5 días hábiles (menos de 1 semana), botón bloqueado con mensaje para contactar al admin
- [ ] Al cancelar, se liberan bloques, estado *Cancelada* y correo de confirmación

---

## Épica 6: Reportes a finanzas

### HU 6.1 — Export on-demand
**Como** administrador
**Quiero** exportar un reporte (Excel/CSV) por rango y estado
**Para** enviarlo a finanzas cuando lo necesite

**Criterios de aceptación:**
- [ ] Incluye datos del solicitante, reserva, campos ARE y costo total

### HU 6.2 — Reporte mensual automático
**Como** administrador
**Quiero** que el sistema envíe el reporte del mes cerrado automáticamente
**Para** no depender de un envío manual

**Criterios de aceptación:**
- [ ] Al inicio del mes siguiente, envía el reporte del mes anterior al correo designado
- [ ] Contiene reservas *External* confirmadas con su costo; se registra en auditoría

---

## Épica 7: Gobernanza y auditoría

### HU 7.1 — Bitácora
**Como** administrador
**Quiero** un registro de acciones administrativas
**Para** trazabilidad

**Criterios de aceptación:**
- [ ] Se registra quién/cuándo: validar, rechazar, cancelar, cambiar config, enviar reporte

---

## Backlog (sin épica asignada / Fase 2+)

- [ ] Operación multi-sala/sede (MTY, QRO) desde la UI
- [ ] SSO Azure AD (interno/externo automático)
- [ ] Tableros de ocupación e ingresos
- [ ] Gestión de recursos adicionales (catering, equipo)

---

## Historias completadas

| HU | Descripción | Sprint | Fecha |
|----|-------------|--------|-------|
| — | (documentación del producto: PRD + Reporte Ejecutivo) | Sprint 1 | 2026-07-02 |
