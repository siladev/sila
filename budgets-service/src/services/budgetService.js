/**
 * Servicio de presupuestos — lógica de negocio.
 *
 * REGLA AGENTS.md: El user_id siempre se obtiene del token JWT
 * (inyectado por el middleware de autenticación), nunca del body del request.
 *
 * REGLA AGENTS.md: Nunca se loguean montos ni datos personales en texto plano.
 */

const db = require('../db/database');

/**
 * Crea un nuevo presupuesto asociado al usuario autenticado.
 * @param {number} userId - ID del usuario (extraído del token JWT)
 * @param {{ category: string, amount_limit: number, period: string }} data
 * @returns {{ id: number, user_id: number, category: string, amount_limit: number, period: string, created_at: string }}
 */
function create(userId, { category, amount_limit, period }) {
  // Verificar si ya existe un presupuesto para esta categoría y periodo
  const existing = db.get(
    'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND period = ?',
    [userId, category, period]
  );

  if (existing) {
    const err = new Error(
      `Ya existe un presupuesto para la categoría '${category}' con periodo '${period}'`
    );
    err.statusCode = 409;
    err.expose = true;
    throw err;
  }

  const result = db.run(
    `INSERT INTO budgets (user_id, category, amount_limit, period)
     VALUES (?, ?, ?, ?)`,
    [userId, category, amount_limit, period]
  );

  // Log seguro: solo el ID del presupuesto creado
  console.log(`Presupuesto creado: id=${result.lastInsertRowid}`);

  return {
    id: result.lastInsertRowid,
    user_id: userId,
    category,
    amount_limit,
    period,
    created_at: new Date().toISOString(),
  };
}

/**
 * Lista presupuestos del usuario autenticado con filtros opcionales.
 * @param {number} userId - ID del usuario (extraído del token JWT)
 * @param {{ category?: string, period?: string }} filters
 * @returns {object[]}
 */
function list(userId, { category, period } = {}) {
  let sql = 'SELECT * FROM budgets WHERE user_id = ?';
  const params = [userId];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (period) {
    sql += ' AND period = ?';
    params.push(period);
  }

  sql += ' ORDER BY category ASC, created_at DESC';

  return db.all(sql, params);
}

module.exports = { create, list };
