const express = require('express');
const cors = require('cors');
const config = require('./config');
const notificationRoutes = require('./routes/notifications');
const { errorHandler } = require('./middleware/errorHandler');
const { initDatabase } = require('./db/database');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'notifications-service' });
});

// Rutas de notificaciones y eventos de alerta
app.use('/api/notifications', notificationRoutes);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

// Inicializar base de datos y luego arrancar el servidor
async function start() {
  try {
    await initDatabase();
    console.log('Base de datos inicializada');

    app.listen(config.port, () => {
      console.log(`notifications-service corriendo en puerto ${config.port}`);
    });
  } catch (err) {
    console.error('Error al iniciar el servicio:', err.message);
    process.exit(1);
  }
}

// Iniciar servidor solo si se ejecuta directamente
if (require.main === module) {
  start();
}

module.exports = { app, start };
