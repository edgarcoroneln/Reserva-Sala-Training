// Errores de dominio con un `status` HTTP asociado, para que el manejador de
// errores de Express responda con el código correcto.

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class ConflictError extends Error {
  constructor(message, conflicts = []) {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
    this.conflicts = conflicts;
  }
}
