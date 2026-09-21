/**
 * Servicio de alertas y notificaciones — lógica de negocio.
 *
 * REGLA AGENTS.md: El user_id siempre se obtiene del token JWT autenticado
 * o contexto verificado.
 *
 * REGLA AGENTS.md: Nunca se loguean montos ni datos personales en texto plano.
 */

const db = require('../db/database');
const budgetClient = require('./budgetClient');

/**
 * Inserta una nueva alerta en la base de datos.
 * @param {number} userId
 * @param {{ type: string, category: string, title: string, message: string, amount_spent: number, amount_limit: number }} data
 * @returns {object}
 */
function createAlert(userId, { type, category, title, message, amount_spent, amount_limit }) {
  const result = db.run(
    `INSERT INTO notifications (user_id, type, category, title, message, amount_spent, amount_limit, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [userId, type, category, title, message, amount_spent, amount_limit]
  );

  // Log seguro: solo id y tipo, nunca datos personales ni montos
  console.log(`Notificación creada: id=${result.lastInsertRowid} type=${type}`);

  return {
    id: result.lastInsertRowid,
    user_id: userId,
    type,
    category,
    title,
    message,
    amount_spent,
    amount_limit,
    is_read: 0,
    created_at: new Date().toISOString(),
  };
}

/**
 * Evalúa una nueva transacción contra el presupuesto correspondiente
 * y determina si se genera una alerta (sobregasto o umbral crítico).
 *
 * @param {number} userId - ID del usuario
 * @param {object} eventData - Datos del evento de transacción
 * @param {number} eventData.amount - Monto de la transacción
 * @param {string} eventData.category - Categoría del gasto
 * @param {string} [eventData.date] - Fecha del gasto
 * @param {number} [eventData.current_spent] - Consumo acumulado opcional
 * @param {number} [eventData.budget_limit] - Límite de presupuesto opcional
 * @param {string} [authToken] - Token JWT para consultar microservicios externos
 * @returns {Promise<object>} Resultado de la evaluación
 */
async function evaluateTransaction(userId, eventData, authToken) {
  const { amount, category, current_spent, budget_limit } = eventData;

  // 1. Determinar el límite presupuestario
  let limit = null;

  if (budget_limit !== undefined && budget_limit !== null) {
    limit = Number(budget_limit);
  } else {
    const budget = await budgetClient.getBudgetByCategory(userId, category, authToken);
    if (budget && budget.amount_limit) {
      limit = Number(budget.amount_limit);
    }
  }

  // Si no hay presupuesto configurado para esta categoría, no se genera alerta
  if (limit === null || isNaN(limit)) {
    return {
      evaluated: true,
      alert_generated: false,
      reason: 'NO_BUDGET',
      message: `No existe un presupuesto configurado para la categoría '${category}'`,
    };
  }

  // 2. Determinar el consumo total evaluado
  // Si se envió 'current_spent', se toma ese monto acumulado; de lo contrario, el monto del gasto
  const totalSpent = (current_spent !== undefined && current_spent !== null)
    ? Number(current_spent)
    : Number(amount);

  const percentage = (totalSpent / limit) * 100;

  // 3. Evaluar reglas de sobregasto y umbral
  if (totalSpent > limit) {
    // Sobregasto superado (OVERSPENT)
    const alert = createAlert(userId, {
      type: 'OVERSPENT',
      category,
      title: `Sobregasto detectado en ${category}`,
      message: `Has superado tu presupuesto en la categoría '${category}'. Consumo actual: $${totalSpent.toFixed(2)} sobre un límite de $${limit.toFixed(2)}.`,
      amount_spent: totalSpent,
      amount_limit: limit,
    });

    return {
      evaluated: true,
      alert_generated: true,
      alert,
      details: {
        total_spent: totalSpent,
        budget_limit: limit,
        percentage: Number(percentage.toFixed(1)),
      },
    };
  }

  if (totalSpent >= limit * 0.8) {
    // Umbral de advertencia alcanzado (>= 80%)
    const alert = createAlert(userId, {
      type: 'WARNING',
      category,
      title: `Alerta preventiva: presupuesto cercano al límite en ${category}`,
      message: `Has alcanzado el ${percentage.toFixed(0)}% de tu presupuesto en la categoría '${category}'. Consumo actual: $${totalSpent.toFixed(2)} de $${limit.toFixed(2)}.`,
      amount_spent: totalSpent,
      amount_limit: limit,
    });

    return {
      evaluated: true,
      alert_generated: true,
      alert,
      details: {
        total_spent: totalSpent,
        budget_limit: limit,
        percentage: Number(percentage.toFixed(1)),
      },
    };
  }

  // Gasto dentro del presupuesto (< 80%)
  return {
    evaluated: true,
    alert_generated: false,
    reason: 'WITHIN_BUDGET',
    message: 'El consumo se encuentra dentro del margen de presupuesto seguro',
    details: {
      total_spent: totalSpent,
      budget_limit: limit,
      percentage: Number(percentage.toFixed(1)),
    },
  };
}

/**
 * Lista las notificaciones de un usuario con filtros opcionales.
 * @param {number} userId
 * @param {{ unreadOnly?: boolean, limit?: number }} options
 * @returns {object[]}
 */
function list(userId, { unreadOnly = false, limit = 50 } = {}) {
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (unreadOnly) {
    sql += ' AND is_read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit) || 50);

  return db.all(sql, params);
}

/**
 * Marca una notificación como leída.
 * @param {number} userId
 * @param {number} notificationId
 * @returns {object}
 */
function markAsRead(userId, notificationId) {
  const existing = db.get(
    'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );

  if (!existing) {
    const err = new Error('Notificación no encontrada');
    err.statusCode = 404;
    err.expose = true;
    throw err;
  }

  db.run(
    'UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  );

  return {
    ...existing,
    is_read: 1,
  };
}

module.exports = {
  createAlert,
  evaluateTransaction,
  list,
  markAsRead,
};
