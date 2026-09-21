/**
 * Cliente HTTP para consultar presupuestos en budgets-service.
 *
 * Utiliza fetch nativo (Node >= 18).
 * REGLA AGENTS.md: Nunca se loguean tokens ni datos personales en texto plano.
 */

const config = require('../config');

/**
 * Consulta los presupuestos configurados para un usuario y categoría.
 * @param {number} userId - ID del usuario
 * @param {string} category - Categoría a consultar
 * @param {string} [token] - Token JWT para autenticación inter-servicio
 * @returns {Promise<object|null>} Retorna el presupuesto si existe, o null
 */
async function getBudgetByCategory(userId, category, token) {
  if (!config.services.budgetsUrl) {
    return null;
  }

  try {
    const url = new URL('/api/budgets', config.services.budgetsUrl);
    url.searchParams.set('category', category);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn(`[budgetClient] Consulta a budgets-service falló con status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const budgets = Array.isArray(data) ? data : data.budgets || [];

    // Buscar presupuesto que coincida con la categoría (y usuario si la respuesta contiene varios)
    const matched = budgets.find(
      (b) =>
        b.category.toLowerCase() === category.toLowerCase() &&
        (!b.user_id || b.user_id === userId)
    );

    return matched || null;
  } catch (err) {
    console.error(`[budgetClient] Error al conectar con budgets-service: ${err.message}`);
    return null;
  }
}

module.exports = {
  getBudgetByCategory,
};
