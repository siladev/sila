const express = require('express');
const budgetService = require('../services/budgetService');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Todos los endpoints de presupuestos requieren autenticación
router.use(authenticate);

const VALID_PERIODS = ['monthly', 'weekly', 'yearly'];

/**
 * POST /api/budgets
 * Crear un nuevo presupuesto para el usuario autenticado.
 */
router.post('/', (req, res, next) => {
  try {
    const { category, amount_limit, period } = req.body;

    // Validación de campos requeridos
    if (!category || amount_limit === undefined || amount_limit === null || !period) {
      return res.status(400).json({
        error: 'Los campos category, amount_limit y period son requeridos',
      });
    }

    // Validación de tipo numérico
    if (typeof amount_limit !== 'number' || isNaN(amount_limit)) {
      return res.status(400).json({
        error: 'El campo amount_limit debe ser un número válido',
      });
    }

    // Validación de monto positivo
    if (amount_limit <= 0) {
      return res.status(400).json({
        error: 'El campo amount_limit debe ser mayor a 0',
      });
    }

    // Validación de periodo
    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({
        error: `El campo period debe ser uno de: ${VALID_PERIODS.join(', ')}`,
      });
    }

    const budget = budgetService.create(req.user.id, {
      category,
      amount_limit,
      period,
    });

    res.status(201).json({
      message: 'Presupuesto creado exitosamente',
      budget,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/budgets
 * Listar presupuestos del usuario autenticado.
 * Query params opcionales: category, period
 */
router.get('/', (req, res, next) => {
  try {
    const { category, period } = req.query;

    const budgets = budgetService.list(req.user.id, {
      category,
      period,
    });

    res.json({
      budgets,
      count: budgets.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
