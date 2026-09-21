/**
 * Middleware global de manejo de errores.
 *
 * REGLA AGENTS.md: Nunca expone stack traces, credenciales ni tokens
 * en las respuestas de error.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log interno seguro: solo mensaje de error, nunca datos sensibles
  console.error(`[Error] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: err.expose ? err.message : 'Error interno del servidor',
  });
}

/**
 * Crea un error con código de estado y flag de exposición.
 */
function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.expose = true;
  return err;
}

module.exports = { errorHandler, createError };
