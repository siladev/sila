const express = require('express');
const reportService = require('../services/reportService');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Todos los endpoints de reportes requieren autenticación
router.use(authenticate);

/**
 * POST /api/reports/monthly
 * Genera el reporte mensual de gastos del usuario autenticado bajo demanda.
 * Body opcional: { month: "YYYY-MM" } (por defecto toma el mes en curso).
 */
router.post('/monthly', async (req, res, next) => {
  try {
    const { month } = req.body || {};

    // Si se especifica mes, validar formato YYYY-MM
    if (month) {
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({
          error: 'El campo month debe tener formato YYYY-MM (ej. 2026-09)',
        });
      }
    }

    const report = await reportService.generateMonthlyReport(
      req.user.id,
      req.token,
      month
    );

    res.status(201).json({
      message: 'Reporte mensual generado exitosamente',
      report,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports
 * Lista todos los reportes generados del usuario autenticado.
 */
router.get('/', (req, res, next) => {
  try {
    const reports = reportService.listUserReports(req.user.id);

    res.json({
      reports,
      count: reports.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/:id
 * Consulta los datos y desglose de un reporte específico.
 */
router.get('/:id', (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({
        error: 'El id del reporte debe ser un número válido',
      });
    }

    const report = reportService.getReportById(req.user.id, reportId);
    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado',
      });
    }

    res.json({
      report,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/:id/download
 * Descarga el archivo de reporte generado físicamente en disco.
 */
router.get('/:id/download', (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({
        error: 'El id del reporte debe ser un número válido',
      });
    }

    const fileInfo = reportService.getReportFile(req.user.id, reportId);
    if (!fileInfo) {
      return res.status(404).json({
        error: 'Archivo de reporte no encontrado o no disponible',
      });
    }

    // Enviar archivo para descarga directa
    res.download(fileInfo.filePath, fileInfo.fileName);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
