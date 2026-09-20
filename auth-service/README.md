# auth-service

Microservicio de autenticación y sesiones para **Sila**.

## Responsabilidades

- Registro de usuarios
- Inicio de sesión con JWT
- Verificación de sesión (endpoint protegido)

## Requisitos

- Node.js >= 18

## Instalación

```bash
cd auth-service
cp .env.example .env    # Editar el secreto JWT para producción
npm install
```

## Ejecución

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servicio arranca en `http://localhost:3001` por defecto.

## Endpoints

| Método | Ruta                | Auth | Descripción                        |
|--------|---------------------|------|------------------------------------|
| GET    | `/api/health`       | No   | Health check                       |
| POST   | `/api/auth/register`| No   | Registro de nuevo usuario          |
| POST   | `/api/auth/login`   | No   | Login, retorna JWT                 |
| GET    | `/api/auth/me`      | Sí   | Perfil del usuario autenticado     |

### POST `/api/auth/register`

```json
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123",
  "name": "Juan Pérez"
}
```

### POST `/api/auth/login`

```json
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123"
}
```

### GET `/api/auth/me`

Header: `Authorization: Bearer <token>`

## Variables de Entorno

| Variable            | Default                              | Descripción                    |
|---------------------|--------------------------------------|--------------------------------|
| `PORT`              | `3001`                               | Puerto del servidor            |
| `JWT_SECRET`        | `dev-secret-no-usar-en-produccion`   | Secreto para firmar JWT        |
| `JWT_EXPIRES_IN`    | `1h`                                 | Duración del token             |
| `BCRYPT_SALT_ROUNDS`| `12`                                 | Rounds de bcrypt               |
| `DB_PATH`           | `./data/auth.db`                     | Ruta al archivo SQLite         |

## Seguridad

- Las contraseñas se hashean con **bcrypt** (salt rounds: 12)
- Los tokens JWT nunca se loguean en texto plano
- Toda validación de sesión pasa por un único módulo central (`src/middleware/authenticate.js`)
