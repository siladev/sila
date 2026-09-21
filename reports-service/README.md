# reports-service

Microservicio de generación y consulta de reportes periódicos de gastos para **Sila**.

## Responsabilidades

- Generar reportes mensuales de gastos bajo demanda agregando datos de `transactions-service` y `budgets-service`
- Calcular agregaciones y métricas financieras clave:
  - Total gastado en el mes
  - Presupuesto total del mes
  - Balance de ahorro/gasto y tasa de ahorro
  - Desglose por categorías (monto gastado, límite presupuestario, remanente, porcentaje de uso, estado `ok` / `warning` / `exceeded` / `unbudgeted`)
  - Identificación de categoría con mayor gasto
- Persistir cada reporte generado como archivo físico accesible en disco (`.json`) para descarga posterior
- Almacenar los metadatos y resúmenes de los reportes en SQLite (`sql.js`)
- Proveer endpoints para listar el histórico de reportes, consultar su detalle y descargar el archivo generado

## Requisitos

- Node.js >= 18
- **auth-service** corriendo en `http://localhost:3001` (provee tokens JWT válidos)
- **transactions-service** corriendo en `http://localhost:3002` (provee los gastos del período)
- **budgets-service** corriendo en `http://localhost:3003` (provee los límites presupuestarios)

## Instalación

```bash
cd reports-service
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

El servicio arranca en `http://localhost:3005` por defecto.

## Endpoints

| Método | Ruta                       | Auth | Descripción                                                     |
|--------|----------------------------|------|-----------------------------------------------------------------|
| GET    | `/api/health`              | No   | Health check                                                    |
| POST   | `/api/reports/monthly`     | Sí   | Genera el reporte del mes actual (u opcional) bajo demanda     |
| GET    | `/api/reports`             | Sí   | Lista todos los reportes generados para el usuario autenticado |
| GET    | `/api/reports/:id`         | Sí   | Consulta el detalle y desglose de un reporte específico        |
| GET    | `/api/reports/:id/download`| Sí   | Descarga directa del archivo de reporte generado (.json)        |

---

### POST `/api/reports/monthly`

Genera un reporte mensual consolidado agregando transacciones y presupuestos del usuario autenticado.

**Header:** `Authorization: Bearer <token>`

**Body opcional:**
```json
{
  "month": "2026-09"
}
```
*Si no se especifica `month`, se genera automáticamente con el mes en curso (`YYYY-MM`).*

**Respuesta (201 Created):**
```json
{
  "message": "Reporte mensual generado exitosamente",
  "report": {
    "id": 1,
    "user_id": 10,
    "month": "2026-09",
    "total_spent": 8450.00,
    "total_budget": 12000.00,
    "balance": 3550.00,
    "file_name": "report-10-2026-09-1774228945123.json",
    "download_url": "/api/reports/1/download",
    "summary": {
      "month": "2026-09",
      "date_range": {
        "from": "2026-09-01",
        "to": "2026-09-30"
      },
      "total_spent": 8450.00,
      "total_budget": 12000.00,
      "balance": 3550.00,
      "savings_rate": 29.58,
      "transactions_count": 8,
      "categories_count": 3,
      "top_spending_category": "comida"
    },
    "categories": [
      {
        "category": "comida",
        "spent": 5200.00,
        "budget_limit": 5000.00,
        "remaining": -200.00,
        "percentage_used": 104.00,
        "status": "exceeded",
        "transaction_count": 5
      },
      {
        "category": "transporte",
        "spent": 2100.00,
        "budget_limit": 3000.00,
        "remaining": 900.00,
        "percentage_used": 70.00,
        "status": "ok",
        "transaction_count": 2
      },
      {
        "category": "servicios",
        "spent": 1150.00,
        "budget_limit": 4000.00,
        "remaining": 2850.00,
        "percentage_used": 28.75,
        "status": "ok",
        "transaction_count": 1
      }
    ],
    "created_at": "2026-09-20T22:30:00.000Z"
  }
}
```

---

### GET `/api/reports`

Lista todos los reportes generados para el usuario autenticado.

**Header:** `Authorization: Bearer <token>`

**Respuesta (200 OK):**
```json
{
  "reports": [
    {
      "id": 1,
      "user_id": 10,
      "month": "2026-09",
      "total_spent": 8450.00,
      "total_budget": 12000.00,
      "balance": 3550.00,
      "file_name": "report-10-2026-09-1774228945123.json",
      "download_url": "/api/reports/1/download",
      "summary": { ... },
      "created_at": "2026-09-20T22:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET `/api/reports/:id`

Obtiene los datos detallados de un reporte específico por su ID.

**Header:** `Authorization: Bearer <token>`

**Respuesta (200 OK):**
```json
{
  "report": {
    "id": 1,
    "user_id": 10,
    "month": "2026-09",
    "report_name": "Reporte Mensual de Gastos — 2026-09",
    "generated_at": "2026-09-20T22:30:00.000Z",
    "summary": { ... },
    "categories": [ ... ],
    "download_url": "/api/reports/1/download"
  }
}
```

---

### GET `/api/reports/:id/download`

Descarga directa del archivo físico de reporte generado.

**Header:** `Authorization: Bearer <token>`

**Respuesta:** Archivo adjunto (`application/json`) con cabecera `Content-Disposition: attachment; filename="report-10-2026-09-1774228945123.json"`.

---

## Variables de Entorno

| Variable                   | Default                               | Descripción                                               |
|----------------------------|---------------------------------------|-----------------------------------------------------------|
| `PORT`                     | `3005`                                | Puerto del servidor                                       |
| `JWT_SECRET`               | `dev-secret-no-usar-en-produccion`    | Secreto para verificar tokens JWT (mismo que auth)        |
| `DB_PATH`                  | `./data/reports.db`                   | Ruta a la base de datos SQLite                            |
| `REPORTS_STORAGE_PATH`     | `./data/reports`                      | Directorio en disco para guardar archivos de reporte      |
| `TRANSACTIONS_SERVICE_URL` | `http://localhost:3002`               | URL base de transactions-service                          |
| `BUDGETS_SERVICE_URL`      | `http://localhost:3003`               | URL base de budgets-service                               |

## Seguridad

- Todos los endpoints de reportes requieren token JWT válido (`Bearer <token>`).
- El `user_id` se extrae del token, nunca de los parámetros o body de la petición.
- Cada usuario solo puede ver, generar o descargar sus propios reportes.
- Toda validación de sesión pasa por el middleware centralizado (`src/middleware/authenticate.js`).
- Los logs del servicio protegen información sensible, evitando registrar montos o credenciales en texto plano.
