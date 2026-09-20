const express = require('express');
const authService = require('../services/authService');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registro de nuevo usuario.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validación de campos requeridos
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Los campos email, password y name son requeridos',
      });
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido',
      });
    }

    // Validación de contraseña mínima
    if (password.length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    const user = await authService.register({ email, password, name });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Inicio de sesión, retorna JWT.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Los campos email y password son requeridos',
      });
    }

    const result = await authService.login({ email, password });

    res.json({
      message: 'Login exitoso',
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Verificación de sesión — retorna el perfil del usuario autenticado.
 * Usa el middleware central de autenticación (AGENTS.md).
 */
router.get('/me', authenticate, (req, res, next) => {
  try {
    const user = authService.getProfile(req.user.id);

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
