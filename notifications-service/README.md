# notifications-service

Microservicio de alertas y notificaciones de sobregasto para **Sila**.

## Responsabilidades

- Recibir eventos de nuevas transacciones y evaluarlos contra el presupuesto correspondiente
- Detectar condiciones de sobregasto (`OVERSPENT`) y umbrales de advertencia preventivos (`WARNING` >= 80%)
- Generar y persistir notificaciones de alerta para el usuario
- Proveer la bandeja de notificaciones del usuario (con filtros de no leídas)
- Marcar notificaciones como leídas

## Requisitos

- Node.js >= 18
- **auth-service** corriendo (emite los tokens JWT que este servicio valida)
- **budgets-service** corriendo (opcional / configurable para consultar límites presupuestarios)

## Instalación

```bash
cd notifications-service
cp .env.example .env    # Asegurar que JWT_SECRET coincida con auth-service
npm install
```

## Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servicio arranca en `http://localhost:3004` por defecto.

## Endpoints

| Método | Ruta                                      | Auth       | Descripción                                                       |
|--------|-------------------------------------------|------------|-------------------------------------------------------------------|
| GET    | `/api/health`                             | No         | Health check                                                      |
| POST   | `/api/notifications/events/transaction`   | Opcional*  | Evalúa un evento de nueva transacción y genera alerta si aplica   |
| GET    | `/api/notifications`                      | Sí         | Listar notificaciones del usuario autenticado                     |
| PATCH  | `/api/notifications/:id/read`             | Sí         | Marcar una notificación específica como leída                     |

\* El endpoint de eventos de transacción puede invocarse con token Bearer (el `user_id` se extrae del JWT) o proveyendo `user_id` en el cuerpo para comunicaciones entre microservicios.

---

### POST `/api/notifications/events/transaction`

Recibe un evento de nueva transacción financiera y determina contra el presupuesto si corresponde disparar una alerta.

Headers (opcional si se envía `user_id` en el body):
`Authorization: Bearer <token>`

#### Ejemplo de Petición:

```json
{
  "user_id": 1,
  "amount": 15000,
  "category": "comida",
  "date": "2026-09-20",
  "current_spent": 55000,
  "budget_limit": 50000
}
```

- **Campos requeridos:** `amount` (número > 0), `category` (texto) y `user_id` (o token en Header).
- **Campos opcionales:**
  - `budget_limit`: Límite presupuestario. Si no se envía, el servicio consulta a `budgets-service`.
  - `current_spent`: Consumo acumulado en la categoría. Si no se envía, se evalúa el monto de la transacción actual.
  - `date`: Fecha de la transacción (formato YYYY-MM-DD).
  - `description`: Detalle o nota de la transacción.

#### Respuesta cuando se genera alerta (201 Created):

```json
{
  "message": "Alerta generada para la transacción evaluada",
  "evaluated": true,
  "alert_generated": true,
  "alert": {
    "id": 1,
    "user_id": 1,
    "type": "OVERSPENT",
    "category": "comida",
    "title": "Sobregasto detectado en comida",
    "message": "Has superado tu presupuesto en la categoría 'comida'. Consumo actual: $55000.00 sobre un límite de $50000.00.",
    "amount_spent": 55000,
    "amount_limit": 50000,
    "is_read": 0,
    "created_at": "2026-09-20T21:55:00.000Z"
  },
  "details": {
    "total_spent": 55000,
    "budget_limit": 50000,
    "percentage": 110.0
  }
}
```

#### Respuesta cuando no se genera alerta (200 OK):

```json
{
  "message": "Transacción evaluada, no se generó alerta",
  "evaluated": true,
  "alert_generated": false,
  "reason": "WITHIN_BUDGET",
  "details": {
    "total_spent": 20000,
    "budget_limit": 50000,
    "percentage": 40.0
  }
}
```

---

### GET `/api/notifications`

Header: `Authorization: Bearer <token>`

Query params opcionales:
- `unread=true`: Devuelve únicamente las alertas pendientes de lectura.
- `limit=50`: Cantidad máxima de registros a devolver.

```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "type": "OVERSPENT",
      "category": "comida",
      "title": "Sobregasto detectado en comida",
      "message": "Has superado tu presupuesto en la categoría 'comida'...",
      "amount_spent": 55000,
      "amount_limit": 50000,
      "is_read": 0,
      "created_at": "2026-09-20T21:55:00.000Z"
    }
  ],
  "count": 1
}
```

---

### PATCH `/api/notifications/:id/read`

Header: `Authorization: Bearer <token>`

```json
{
  "message": "Notificación marcada como leída",
  "notification": {
    "id": 1,
    "user_id": 1,
    "type": "OVERSPENT",
    "is_read": 1
  }
}
```

---

## Variables de Entorno

| Variable                  | Default                                 | Descripción                                          |
|---------------------------|-----------------------------------------|------------------------------------------------------|
| `PORT`                    | `3004`                                  | Puerto del servidor HTTP                             |
| `JWT_SECRET`              | `dev-secret-no-usar-en-produccion`      | Secreto para verificar JWT (mismo que auth-service)  |
| `DB_PATH`                 | `./data/notifications.db`               | Ruta al archivo SQLite local                         |
| `BUDGETS_SERVICE_URL`     | `http://localhost:3003`                 | URL base del microservicio de presupuestos           |
| `TRANSACTIONS_SERVICE_URL`| `http://localhost:3002`                 | URL base del microservicio de transacciones          |

## Seguridad

- Toda validación de sesión de usuario pasa por el middleware centralizado (`src/middleware/authenticate.js`).
- Los endpoints de consulta y marcado de lectura garantizan aislamiento total por `user_id` autenticado.
- Nunca se exponen credenciales ni stack traces sensibles en logs o respuestas HTTP de error.
