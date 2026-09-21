/**
 * Cliente HTTP para consultar presupuestos en budgets-service.
 *
 * Utiliza fetch nativo (Node >= 18).
 * REGLA AGENTS.md: Nunca se loguean tokens ni datos personales en texto plano.
 */

const config = require('../config');

/**
 * Obtiene los presupuestos configurados por el usuario.
 * @param {string} token - Token JWT del usuario autenticado
 * @param {string} [period='monthly'] - Período de presupuestos a filtrar
 * @returns {Promise<Array<object>>} Lista de presupuestos
 */
async function getBudgets(token, period = 'monthly') {
  if (!config.services.budgetsUrl) {
    throw new Error('BUDGETS_SERVICE_URL no está configurado');
  }

  try {
    const url = new URL('/api/budgets', config.services.budgetsUrl);
    if (period) {
      url.searchParams.set('period', period);
    }

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
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    return data.budgets || [];
  } catch (err) {
    console.error(`[budgetClient] Error al conectar con budgets-service: ${err.message}`);
    throw err;
  }
}

module.exports = {
  getBudgets,
};
