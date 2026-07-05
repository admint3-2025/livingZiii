# ZIII Living — Arranque local (sin Docker)

## Requisitos
- Node.js 20+
- npm

## Inicio rápido

Abre **2 terminales** en la raíz del proyecto:

```powershell
# Terminal 1 — API
npm run dev:backend

# Terminal 2 — Web admin
npm run dev:web
```

## URLs

| Servicio | URL |
|----------|-----|
| Web admin | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Health | http://localhost:3000/health |

## Credenciales demo

- **Email:** admin@example.com
- **Password:** password

Se crean automáticamente al iniciar el backend (organización "ZIII Living Demo").

## Base de datos

Por defecto usa **SQLite** (`apps/backend/data/ziii_living_dev.sqlite`) — no requiere Docker ni PostgreSQL.

Para PostgreSQL (producción/staging), en `.env`:

```
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ziii_user
DATABASE_PASSWORD=ziii_password_dev
DATABASE_NAME=ziii_living_dev
```

Luego: `npm run docker:up` (requiere Docker Desktop).

## Qué funciona hoy

- [x] Login JWT
- [x] CRUD organizaciones (API + UI)
- [x] Dashboard con conteo de organizaciones
- [x] Seed automático de datos demo
- [x] Swagger documentación

## Próximo en roadmap

- [ ] Propiedades y unidades (controllers)
- [ ] Módulo financiero (cuotas UI)
- [ ] Integración QR / control de acceso (fabricantes)
- [ ] Pagos en línea (Mercado Pago)
- [ ] Facturación fiscal (SAT — pendiente validación regulatoria)
