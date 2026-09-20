/**
 * Servicio de transacciones — lógica de negocio.
 *
 * REGLA AGENTS.md: El user_id siempre se obtiene del token JWT
 * (inyectado por el middleware de autenticación), nunca del body del request.
 *
 * REGLA AGENTS.md: Nunca se loguean montos ni datos personales en texto plano.
 */

const db = require('../db/database');

/**
 * Crea una nueva transacción asociada al usuario autenticado.
 * @param {number} userId - ID del usuario (extraído del token JWT)
 * @param {{ amount: number, category: string, description?: string, date: string }} data
 * @returns {{ id: number, user_id: number, amount: number, category: string, description: string|null, date: string, created_at: string }}
 */
function create(userId, { amount, category, description, date }) {
  const result = db.run(
    `INSERT INTO transactions (user_id, amount, category, description, date)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, amount, category, description || null, date]
  );

  // Log seguro: solo el ID de la transacción creada
  console.log(`Transacción creada: id=${result.lastInsertRowid}`);

  return {
    id: result.lastInsertRowid,
    user_id: userId,
    amount,
    category,
    description: description || null,
    date,
    created_at: new Date().toISOString(),
  };
}

/**
 * Lista transacciones del usuario autenticado con filtros opcionales.
 * @param {number} userId - ID del usuario (extraído del token JWT)
 * @param {{ category?: string, from?: string, to?: string }} filters
 * @returns {object[]}
 */
function list(userId, { category, from, to } = {}) {
  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [userId];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (from) {
    sql += ' AND date >= ?';
    params.push(from);
  }

  if (to) {
    sql += ' AND date <= ?';
    params.push(to);
  }

  sql += ' ORDER BY date DESC, created_at DESC';

  return db.all(sql, params);
}

module.exports = { create, list };
