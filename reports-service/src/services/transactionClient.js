/**
 * Cliente HTTP para consultar transacciones en transactions-service.
 *
 * Utiliza fetch nativo (Node >= 18).
 * REGLA AGENTS.md: Nunca se loguean tokens ni datos personales en texto plano.
 */

const config = require('../config');

/**
 * Obtiene las transacciones de un usuario en un rango de fechas.
 * @param {string} token - Token JWT del usuario autenticado
 * @param {string} from - Fecha inicial 'YYYY-MM-DD'
 * @param {string} to - Fecha final 'YYYY-MM-DD'
 * @returns {Promise<Array<object>>} Lista de transacciones
 */
async function getTransactions(token, from, to) {
  if (!config.services.transactionsUrl) {
    throw new Error('TRANSACTIONS_SERVICE_URL no está configurado');
  }

  try {
    const url = new URL('/api/transactions', config.services.transactionsUrl);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

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
      console.warn(`[transactionClient] Consulta a transactions-service falló con status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    }
    return data.transactions || [];
  } catch (err) {
    console.error(`[transactionClient] Error al conectar con transactions-service: ${err.message}`);
    throw err;
  }
}

module.exports = {
  getTransactions,
};
