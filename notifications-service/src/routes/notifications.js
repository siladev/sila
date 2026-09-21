const express = require('express');
const alertService = require('../services/alertService');
const { authenticate, optionalAuthenticate } = require('../middleware/authenticate');

const router = express.Router();

/**
 * POST /api/notifications/events/transaction
 * Endpoint que recibe un evento de nueva transacción y determina, contra el
 * presupuesto correspondiente, si se debe generar una alerta de sobregasto.
 *
 * Puede ser invocado con token JWT (Bearer) o con user_id explícito en el body
 * para comunicaciones entre microservicios.
 */
router.post('/events/transaction', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      amount,
      category,
      date,
      description,
      current_spent,
      budget_limit,
      user_id: bodyUserId,
    } = req.body;

    // Obtener user_id desde el token autenticado o del payload
    const userId = req.user?.id || (bodyUserId ? Number(bodyUserId) : null);

    if (!userId) {
      return res.status(400).json({
        error: 'Identificador de usuario no proporcionado (se requiere token Bearer o user_id en el cuerpo)',
      });
    }

    // Validación de campos requeridos
    if (amount === undefined || amount === null || !category) {
      return res.status(400).json({
        error: 'Los campos amount y category son requeridos en el evento de transacción',
      });
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'El campo amount debe ser un número mayor a 0',
      });
    }

    // Obtener token original si existe para llamadas delegadas a budgets-service
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    const evaluation = await alertService.evaluateTransaction(
      userId,
      {
        amount,
        category: category.trim(),
        date,
        description,
        current_spent,
        budget_limit,
      },
      token
    );

    const status = evaluation.alert_generated ? 201 : 200;

    res.status(status).json({
      message: evaluation.alert_generated
        ? 'Alerta generada para la transacción evaluada'
        : 'Transacción evaluada, no se generó alerta',
      ...evaluation,
    });
  } catch (err) {
    next(err);
  }
});

// Alias amigable para compatibilidad
router.post('/transaction-event', optionalAuthenticate, (req, res, next) => {
  req.url = '/events/transaction';
  router.handle(req, res, next);
});

/**
 * GET /api/notifications
 * Listar notificaciones del usuario autenticado.
 * Query params opcionales: unread=true, limit=50
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

    const notifications = alertService.list(req.user.id, { unreadOnly, limit });

    res.json({
      notifications,
      count: notifications.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marcar una notificación específica como leída.
 */
router.patch('/:id/read', authenticate, (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id, 10);

    if (isNaN(notificationId)) {
      return res.status(400).json({
        error: 'El id de la notificación debe ser un número válido',
      });
    }

    const updated = alertService.markAsRead(req.user.id, notificationId);

    res.json({
      message: 'Notificación marcada como leída',
      notification: updated,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
