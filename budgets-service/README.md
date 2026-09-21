# budgets-service

Microservicio de definición y consulta de presupuestos por categoría para **Sila**.

## Responsabilidades

- Crear presupuestos (categoría, monto límite, periodo)
- Listar presupuestos del usuario autenticado
- Filtrar por categoría y periodo

## Requisitos

- Node.js >= 18
- **auth-service** corriendo (emite los tokens JWT que este servicio valida)

## Instalación

```bash
cd budgets-service
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

El servicio arranca en `http://localhost:3003` por defecto.

## Endpoints

| Método | Ruta             | Auth | Descripción                                    |
|--------|------------------|------|------------------------------------------------|
| GET    | `/api/health`    | No   | Health check                                   |
| POST   | `/api/budgets`   | Sí   | Crear presupuesto para el usuario autenticado   |
| GET    | `/api/budgets`   | Sí   | Listar presupuestos del usuario (con filtros)   |

### POST `/api/budgets`

Header: `Authorization: Bearer <token>`

```json
{
  "category": "comida",
  "amount_limit": 50000,
  "period": "monthly"
}
```

Campos requeridos: `category`, `amount_limit`, `period`.
Valores válidos para `period`: `monthly`, `weekly`, `yearly`.

### GET `/api/budgets`

Header: `Authorization: Bearer <token>`

Query params opcionales:

| Param      | Ejemplo    | Descripción             |
|------------|------------|-------------------------|
| `category` | `comida`   | Filtrar por categoría   |
| `period`   | `monthly`  | Filtrar por periodo     |

Ejemplo: `GET /api/budgets?category=comida&period=monthly`

## Variables de Entorno

| Variable     | Default                              | Descripción                                  |
|--------------|--------------------------------------|----------------------------------------------|
| `PORT`       | `3003`                               | Puerto del servidor                          |
| `JWT_SECRET` | `dev-secret-no-usar-en-produccion`   | Secreto para verificar JWT (mismo que auth)  |
| `DB_PATH`    | `./data/budgets.db`                  | Ruta al archivo SQLite                       |

## Seguridad

- Todos los endpoints de presupuestos requieren token JWT válido
- El `user_id` se extrae del token, nunca del body del request
- Cada usuario solo puede ver y crear sus propios presupuestos
- Toda validación de sesión pasa por un único módulo central (`src/middleware/authenticate.js`)
- No se permite crear presupuestos duplicados (misma categoría + periodo para el mismo usuario)
