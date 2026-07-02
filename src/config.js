// Configuración del MVP. En el futuro (Épica 7 del PRD) estos valores vivirán en
// la tabla `config` y serán editables desde el módulo de administración.

// Sala única del MVP. El modelo de datos ya es multi-sala (tabla `rooms`),
// pero por ahora solo opera la 2C-1 (2 Patios, CDMX).
export const ROOM = {
  id: '2C-1',
  name: 'Sala de Entrenamiento 2C-1',
  site: 'CDMX',
};

// Cada día se divide en dos bloques reservables.
export const SLOTS = ['AM', 'PM'];
export const SLOT_TIMES = { AM: '08:00–13:00', PM: '13:00–18:00' };

// Tarifas (USD). Un día completo = 2 bloques.
export const PRICE_HALF_USD = 150;
export const PRICE_DAY_USD = PRICE_HALF_USD * 2; // 300

// Tipos de renta. Internal = DISW (sin costo, sin ARE); External = con costo + ARE.
export const RENTAL_TYPES = ['internal', 'external'];

// Duración de la reserva.
export const DURATION_TYPES = ['half', 'complete'];

// Estados de la reserva que ocupan el calendario (bloquean disponibilidad).
export const OCCUPYING_STATUSES = ['pending', 'confirmed'];
