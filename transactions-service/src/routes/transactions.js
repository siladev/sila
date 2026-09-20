const express = require('express');
const transactionService = require('../services/transactionService');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Todos los endpoints de transacciones requieren autenticación
router.use(authenticate);

/**
 * POST /api/transactions
 * Crear una nueva transacción para el usuario autenticado.
 */
router.post('/', (req, res, next) => {
  try {
    const { amount, category, description, date } = req.body;

    // Validación de campos requeridos
    if (amount === undefined || amount === null || !category || !date) {
      return res.status(400).json({
        error: 'Los campos amount, category y date son requeridos',
      });
    }

    // Validación de tipo numérico
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({
        error: 'El campo amount debe ser un número válido',
      });
    }

    // Validación de monto positivo
    if (amount <= 0) {
      return res.status(400).json({
        error: 'El campo amount debe ser mayor a 0',
      });
    }

    // Validación básica de formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        error: 'El campo date debe tener formato YYYY-MM-DD',
      });
    }

    const transaction = transactionService.create(req.user.id, {
      amount,
      category,
      description,
      date,
    });

    res.status(201).json({
      message: 'Transacción creada exitosamente',
      transaction,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/transactions
 * Listar transacciones del usuario autenticado.
 * Query params opcionales: category, from, to
 */
router.get('/', (req, res, next) => {
  try {
    const { category, from, to } = req.query;

    const transactions = transactionService.list(req.user.id, {
      category,
      from,
      to,
    });

    res.json({
      transactions,
      count: transactions.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
