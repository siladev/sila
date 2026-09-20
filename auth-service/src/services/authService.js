/**
 * Servicio de autenticación — lógica de negocio.
 *
 * REGLA AGENTS.md: Toda lógica de hashing de contraseñas está concentrada
 * en este módulo. Cualquier cambio al hashing requiere justificación
 * explícita en el plan antes de ejecutarse.
 *
 * Hashing: bcryptjs con salt rounds configurable (default: 12).
 * Justificación: bcrypt es resistente a ataques de fuerza bruta por su
 * factor de costo adaptable y es el estándar OWASP para hashing de passwords.
 *
 * REGLA AGENTS.md: Nunca se loguean credenciales ni tokens en texto plano.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config');

/**
 * Registra un nuevo usuario.
 * @param {{ email: string, password: string, name: string }} data
 * @returns {{ id: number, email: string, name: string, created_at: string }}
 */
async function register({ email, password, name }) {
  // Verificar si el email ya existe
  const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.statusCode = 409;
    err.expose = true;
    throw err;
  }

  // Hashear contraseña — NUNCA se almacena en texto plano
  const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const result = db.run(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
    [email, hashedPassword, name]
  );

  // Log seguro: solo el ID del usuario creado
  console.log(`Usuario registrado: id=${result.lastInsertRowid}`);

  return {
    id: result.lastInsertRowid,
    email,
    name,
    created_at: new Date().toISOString(),
  };
}

/**
 * Autentica un usuario y retorna un JWT.
 * @param {{ email: string, password: string }} data
 * @returns {{ token: string, user: { id: number, email: string, name: string } }}
 */
async function login({ email, password }) {
  const user = db.get('SELECT * FROM users WHERE email = ?', [email]);

  if (!user) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    err.expose = true;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    err.expose = true;
    throw err;
  }

  // Generar token JWT — NUNCA se loguea el token generado
  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  // Log seguro: solo el ID del usuario autenticado
  console.log(`Login exitoso: userId=${user.id}`);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

/**
 * Retorna el perfil del usuario autenticado (sin contraseña).
 * @param {number} userId
 * @returns {{ id: number, email: string, name: string, created_at: string, updated_at: string }}
 */
function getProfile(userId) {
  const user = db.get(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    err.expose = true;
    throw err;
  }

  return user;
}

module.exports = { register, login, getProfile };
