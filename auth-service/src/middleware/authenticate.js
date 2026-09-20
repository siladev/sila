/**
 * Módulo central de validación de sesión.
 *
 * REGLA AGENTS.md: Toda validación de sesión debe pasar por este único módulo.
 * Ningún otro archivo debe verificar tokens JWT directamente.
 *
 * REGLA AGENTS.md: Nunca se loguean tokens ni credenciales en texto plano.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token de autenticación requerido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    // Inyectar datos del usuario en el request
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    // Log seguro: solo el tipo de error, nunca el token
    console.error(`Error de autenticación: ${err.name}`);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
      });
    }

    return res.status(401).json({
      error: 'Token inválido',
    });
  }
}

module.exports = authenticate;
