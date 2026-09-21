/**
 * Servicio de reportes financieros — lógica de negocio y agregaciones.
 *
 * REGLA AGENTS.md: El user_id siempre se obtiene del token JWT
 * (inyectado por el middleware de autenticación), nunca del body ni params.
 *
 * REGLA AGENTS.md: Nunca se loguean montos ni datos personales en texto plano.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('../db/database');
const { getTransactions } = require('./transactionClient');
const { getBudgets } = require('./budgetClient');

/**
 * Obtiene el rango de fechas 'YYYY-MM-DD' para un mes dado.
 * Si no se indica mes, utiliza el mes actual.
 * @param {string} [monthStr] - Mes en formato 'YYYY-MM'
 * @returns {{ month: string, from: string, to: string }}
 */
function getMonthDateRange(monthStr) {
  let year;
  let month;

  if (monthStr) {
    const parts = monthStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const monthPadded = String(month).padStart(2, '0');
  const monthKey = `${year}-${monthPadded}`;
  const from = `${monthKey}-01`;

  // Último día del mes: pasando 0 como día del mes siguiente
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${monthKey}-${String(lastDay).padStart(2, '0')}`;

  return { month: monthKey, from, to };
}

/**
 * Genera el reporte mensual de gastos agregando datos de transacciones y presupuestos.
 * Guarda el reporte como un archivo JSON en disco y persiste el registro en SQLite.
 *
 * @param {number} userId - ID del usuario autenticado
 * @param {string} token - Token JWT para consultar otros microservicios
 * @param {string} [requestedMonth] - Mes opcional en formato 'YYYY-MM'
 * @returns {Promise<object>} Reporte generado y metadatos
 */
async function generateMonthlyReport(userId, token, requestedMonth) {
  const { month, from, to } = getMonthDateRange(requestedMonth);

  // 1. Obtener transacciones y presupuestos en paralelo
  const [transactions, budgets] = await Promise.all([
    getTransactions(token, from, to),
    getBudgets(token, 'monthly'),
  ]);

  // 2. Agregación de transacciones por categoría
  let totalSpent = 0;
  const expensesByCategory = {};

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    totalSpent += amount;

    const catKey = (tx.category || 'otros').trim().toLowerCase();
    if (!expensesByCategory[catKey]) {
      expensesByCategory[catKey] = {
        category: tx.category || 'Otros',
        spent: 0,
        transaction_count: 0,
      };
    }
    expensesByCategory[catKey].spent += amount;
    expensesByCategory[catKey].transaction_count += 1;
  }

  // 3. Mapeo de presupuestos por categoría
  let totalBudget = 0;
  const budgetsByCategory = {};

  for (const b of budgets) {
    const catKey = (b.category || '').trim().toLowerCase();
    const limit = Number(b.amount_limit) || 0;
    totalBudget += limit;
    budgetsByCategory[catKey] = {
      ...b,
      amount_limit: limit,
    };
  }

  // 4. Consolidar categorías (unión de categorías con gastos y con presupuestos)
  const allCategoryKeys = Array.from(
    new Set([...Object.keys(expensesByCategory), ...Object.keys(budgetsByCategory)])
  );

  const categories = allCategoryKeys.map((catKey) => {
    const exp = expensesByCategory[catKey];
    const bud = budgetsByCategory[catKey];

    const categoryName = exp ? exp.category : (bud ? bud.category : catKey);
    const spent = exp ? Number(exp.spent.toFixed(2)) : 0;
    const count = exp ? exp.transaction_count : 0;
    const hasBudget = Boolean(bud);
    const limit = hasBudget ? Number(bud.amount_limit.toFixed(2)) : null;
    const remaining = hasBudget ? Number((limit - spent).toFixed(2)) : null;
    const percentageUsed = hasBudget && limit > 0
      ? Number(((spent / limit) * 100).toFixed(2))
      : null;

    let status = 'ok';
    if (!hasBudget) {
      status = 'unbudgeted';
    } else if (spent > limit) {
      status = 'exceeded';
    } else if (percentageUsed >= 80) {
      status = 'warning';
    }

    return {
      category: categoryName,
      spent,
      budget_limit: limit,
      remaining,
      percentage_used: percentageUsed,
      status,
      transaction_count: count,
    };
  });

  // Ordenar categorías por gasto descendente
  categories.sort((a, b) => b.spent - a.spent);

  const topCategory = categories.find((c) => c.spent > 0)?.category || null;
  const balance = Number((totalBudget - totalSpent).toFixed(2));
  const roundedTotalSpent = Number(totalSpent.toFixed(2));
  const roundedTotalBudget = Number(totalBudget.toFixed(2));
  const savingsRate = roundedTotalBudget > 0
    ? Number((((roundedTotalBudget - roundedTotalSpent) / roundedTotalBudget) * 100).toFixed(2))
    : 0;

  const summary = {
    month,
    date_range: { from, to },
    total_spent: roundedTotalSpent,
    total_budget: roundedTotalBudget,
    balance,
    savings_rate: savingsRate,
    transactions_count: transactions.length,
    categories_count: categories.length,
    top_spending_category: topCategory,
  };

  // 5. Crear directorio de almacenamiento si no existe
  if (!fs.existsSync(config.storage.reportsDir)) {
    fs.mkdirSync(config.storage.reportsDir, { recursive: true });
  }

  // 6. Preparar archivo de reporte
  const timestamp = Date.now();
  const fileName = `report-${userId}-${month}-${timestamp}.json`;
  const filePath = path.join(config.storage.reportsDir, fileName);

  const reportPayload = {
    report_name: `Reporte Mensual de Gastos — ${month}`,
    user_id: userId,
    month,
    generated_at: new Date().toISOString(),
    summary,
    categories,
    transactions_count: transactions.length,
  };

  // Escribir archivo físico accesible en disco
  fs.writeFileSync(filePath, JSON.stringify(reportPayload, null, 2), 'utf-8');

  // 7. Persistir registro en base de datos SQLite
  const insertResult = db.run(
    `INSERT INTO reports (user_id, month, total_spent, total_budget, balance, file_path, file_name, summary_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      month,
      roundedTotalSpent,
      roundedTotalBudget,
      balance,
      filePath,
      fileName,
      JSON.stringify(summary),
    ]
  );

  const reportId = insertResult.lastInsertRowid;

  // Actualizar ID en el archivo guardado
  reportPayload.id = reportId;
  fs.writeFileSync(filePath, JSON.stringify(reportPayload, null, 2), 'utf-8');

  // Log seguro: solo el ID del reporte generado
  console.log(`Reporte generado: id=${reportId} mes=${month}`);

  return {
    id: reportId,
    user_id: userId,
    month,
    total_spent: roundedTotalSpent,
    total_budget: roundedTotalBudget,
    balance,
    file_name: fileName,
    download_url: `/api/reports/${reportId}/download`,
    summary,
    categories,
    created_at: new Date().toISOString(),
  };
}

/**
 * Lista todos los reportes generados para un usuario.
 * @param {number} userId - ID del usuario autenticado
 * @returns {Array<object>}
 */
function listUserReports(userId) {
  const rows = db.all(
    `SELECT id, user_id, month, total_spent, total_budget, balance, file_name, created_at, summary_json
     FROM reports
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    month: row.month,
    total_spent: row.total_spent,
    total_budget: row.total_budget,
    balance: row.balance,
    file_name: row.file_name,
    download_url: `/api/reports/${row.id}/download`,
    summary: JSON.parse(row.summary_json || '{}'),
    created_at: row.created_at,
  }));
}

/**
 * Obtiene el detalle de un reporte por ID verificando propiedad del usuario.
 * @param {number} userId - ID del usuario autenticado
 * @param {number} reportId - ID del reporte
 * @returns {object|null}
 */
function getReportById(userId, reportId) {
  const row = db.get(
    `SELECT * FROM reports WHERE id = ? AND user_id = ?`,
    [reportId, userId]
  );

  if (!row) {
    return null;
  }

  // Si existe el archivo en disco, leemos los detalles completos
  if (fs.existsSync(row.file_path)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(row.file_path, 'utf-8'));
      return {
        ...fileData,
        download_url: `/api/reports/${row.id}/download`,
      };
    } catch {
      // Fallback a los datos de la base de datos
    }
  }

  return {
    id: row.id,
    user_id: row.user_id,
    month: row.month,
    total_spent: row.total_spent,
    total_budget: row.total_budget,
    balance: row.balance,
    file_name: row.file_name,
    download_url: `/api/reports/${row.id}/download`,
    summary: JSON.parse(row.summary_json || '{}'),
    created_at: row.created_at,
  };
}

/**
 * Obtiene la ruta al archivo de reporte verificando permisos de acceso.
 * @param {number} userId - ID del usuario autenticado
 * @param {number} reportId - ID del reporte
 * @returns {{ filePath: string, fileName: string }|null}
 */
function getReportFile(userId, reportId) {
  const row = db.get(
    `SELECT file_path, file_name FROM reports WHERE id = ? AND user_id = ?`,
    [reportId, userId]
  );

  if (!row) {
    return null;
  }

  if (!fs.existsSync(row.file_path)) {
    return null;
  }

  return {
    filePath: row.file_path,
    fileName: row.file_name,
  };
}

module.exports = {
  getMonthDateRange,
  generateMonthlyReport,
  listUserReports,
  getReportById,
  getReportFile,
};
