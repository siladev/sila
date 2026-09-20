# transactions-service

Microservicio de registro y categorización de gastos para **Sila**.

## Responsabilidades

- Crear transacciones (monto, categoría, fecha)
- Listar transacciones del usuario autenticado
- Filtrar por categoría y rango de fechas

## Requisitos

- Node.js >= 18
- **auth-service** corriendo (emite los tokens JWT que este servicio valida)

## Instalación

```bash
cd transactions-service
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

El servicio arranca en `http://localhost:3002` por defecto.

## Endpoints

| Método | Ruta                  | Auth | Descripción                                   |
|--------|-----------------------|------|-----------------------------------------------|
| GET    | `/api/health`         | No   | Health check                                  |
| POST   | `/api/transactions`   | Sí   | Crear transacción para el usuario autenticado  |
| GET    | `/api/transactions`   | Sí   | Listar transacciones del usuario (con filtros) |

### POST `/api/transactions`

Header: `Authorization: Bearer <token>`

```json
{
  "amount": 150.50,
  "category": "comida",
  "description": "Almuerzo con equipo",
  "date": "2026-09-20"
}
```

Campos requeridos: `amount`, `category`, `date`.
Campo opcional: `description`.

### GET `/api/transactions`

Header: `Authorization: Bearer <token>`

Query params opcionales:

| Param      | Ejemplo        | Descripción                |
|------------|----------------|----------------------------|
| `category` | `comida`       | Filtrar por categoría      |
| `from`     | `2026-09-01`   | Fecha desde (inclusive)    |
| `to`       | `2026-09-30`   | Fecha hasta (inclusive)    |

Ejemplo: `GET /api/transactions?category=comida&from=2026-09-01&to=2026-09-30`

## Variables de Entorno

| Variable     | Default                              | Descripción                                  |
|--------------|--------------------------------------|----------------------------------------------|
| `PORT`       | `3002`                               | Puerto del servidor                          |
| `JWT_SECRET` | `dev-secret-no-usar-en-produccion`   | Secreto para verificar JWT (mismo que auth)  |
| `DB_PATH`    | `./data/transactions.db`             | Ruta al archivo SQLite                       |

## Seguridad

- Todos los endpoints de transacciones requieren token JWT válido
- El `user_id` se extrae del token, nunca del body del request
- Cada usuario solo puede ver y crear sus propias transacciones
- Toda validación de sesión pasa por un único módulo central (`src/middleware/authenticate.js`)
