# ZIII Living — Quick Start ⚡

## ✅ Current Status

- ✅ Dependencies installed (npm 11.6.2)
- ✅ Node.js v24.11.1 ready
- ✅ All 8 backend modules scaffolded
- ✅ React admin dashboard ready
- ⚠️ Docker not in PATH (need to install separately)

---

## 🚀 Start Development (2 Terminals)

### Terminal 1: Backend API (Port 3000)

```bash
cd "d:\1. Living pro ZIII"
npm run dev:backend

# Expected output:
# [Nest] 12345  - 06/12/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12345  - 06/12/2026, 10:00:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
# [Nest] 12345  - 06/12/2026, 10:00:00 AM     LOG [NestApplication] Nest application successfully started +234ms
```

### Terminal 2: Frontend Dashboard (Port 5173)

```bash
cd "d:\1. Living pro ZIII"
npm run dev:web

# Expected output:
# VITE v5.0.0  ready in 234 ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Browser

Open: http://localhost:5173

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React admin dashboard |
| Backend | http://localhost:3000 | NestJS API |
| Swagger Docs | http://localhost:3000/api | API documentation |
| Health Check | http://localhost:3000/health | Backend status |

---

## 📋 Setup Checklist

- [x] Install dependencies
- [x] Configure TypeScript
- [x] Setup Vite (frontend)
- [x] Setup NestJS (backend)
- [x] Create 8 backend modules
- [x] Create React pages & components
- [ ] Install & start Docker (for database)
- [ ] Implement `/auth/login` endpoint
- [ ] Connect frontend login to backend

---

## 🐳 Docker Setup (Optional for Now)

If you want to use PostgreSQL with Docker:

1. **Install Docker Desktop**
   - https://www.docker.com/products/docker-desktop
   - Restart PowerShell after install

2. **Start containers**
   ```bash
   npm run docker:up
   
   # Verify
   docker ps
   ```

3. **Access database**
   ```
   Adminer:     http://localhost:8080
   PostgreSQL:  localhost:5432
   Redis:       localhost:6379
   ```

---

## 📁 Project Structure

```
d:\1. Living pro ZIII\
├── apps/
│   ├── backend/              ← NestJS API
│   ├── web/                  ← React Dashboard (Port 5173)
│   └── mobile/               ← React Native (Port 19000, optional)
├── packages/
│   └── shared/               ← Shared types & contracts
├── infrastructure/
│   └── docker/               ← docker-compose.yml
├── package.json              ← Workspace root
└── SETUP.md                  ← Full setup guide
```

---

## 🔑 Environment Variables

### Backend (apps/backend/.env)

```bash
# Database (use Docker or local PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ziii_living

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRATION=3600

# Providers (for future implementation)
PAYMENT_PROVIDER=mercado-pago
ACCESS_CONTROL_PROVIDER=hikvision
```

### Frontend (apps/web/.env)

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🎯 High-Priority Tasks
├── entities/
│   ├── quota.entity.ts
│   └── charge.entity.ts
├── services/
│   └── financial.service.ts
├── controllers/
│   └── financial.controller.ts
├── dtos/
│   ├── create-quota.dto.ts
│   └── create-charge.dto.ts
└── financial.module.ts
```

---

## 📊 Base de Datos

```
Organizations (empresa que gestiona condominios)
  ├── Properties (condominios, edificios)
  │   ├── Units (departamentos, casas)
  │   │   └── Residents (Users)
  │   └── AccessEvents (bitácora de acceso)
  ├── Users (admin, guardias, residentes)
  └── Quotas, Charges, PaymentRecords (financiero)
```

---

## 🔐 Autenticación

JWT en header: `Authorization: Bearer <token>`

Roles:
- `admin` — Acceso total
- `manager` — Gestión de propiedad
- `resident` — Ver su unidad y estado de cuenta
- `guard` — Validar visitantes
- `visitor` — Acceso temporal

---

## 💳 Flujo de Pago (MVP)

```
Residente ve cuota en app
  ↓
Clica "Pagar"
  ↓
Backend crea solicitud → PaymentProvider (Mercado Pago)
  ↓
Residente completa pago
  ↓
Proveedor envía webhook → Backend
  ↓
Backend actualiza estado de cuota + auditoría
  ↓
Residente ve "Pagado" en app
```

---

## 🚪 Flujo de Acceso (MVP)

```
Residente crea invitación (nombre visitante, fecha/hora)
  ↓
Backend genera QR via AccessControlProvider (Hikvision/Dahua)
  ↓
Residente comparte QR con visitante (foto, WhatsApp, etc.)
  ↓
Visitante llega, guardia escanea QR
  ↓
Guardia ve "Acceso aprobado" en app
  ↓
Backend registra evento en bitácora
  ↓
Residente ve "Visitante entrada/salida" en timeline
```

---

## 📝 Agregar un Nuevo Endpoint

```typescript
// financial.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { FinancialService } from './financial.service';

@Controller('financial')
export class FinancialController {
  constructor(private readonly service: FinancialService) {}

  @Post('quotas')
  async createQuota(@Body() dto: CreateQuotaDto) {
    return this.service.createQuota(dto);
  }

  @Get('quotas/:id')
  async getQuota(@Param('id') id: string) {
    return this.service.getQuota(id);
  }
}
```

---

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

---

## 🚢 Deploy

```bash
# Build producción
npm run build

# Dockerfile ya existe
docker build -f infrastructure/docker/Dockerfile.backend -t ziii-backend:0.1.0 .

# Subir a tu registro (ECR, DockerHub, etc.)
docker push ziii-backend:0.1.0
```

---

## ❓ FAQ

**P: ¿Cómo agrego un nuevo proveedor de pago?**  
R: Implementa la interfaz `PaymentProvider` (ve `packages/shared/src/contracts/payment.provider.ts`), crea la clase y registrala en `PaymentModule`.

**P: ¿Cómo sincronizo eventos de acceso del hardware?**  
R: El `AccessControlProvider` tiene `syncAccessEvents()` y `handleWebhook()`. Configura el webhook en el proveedor para que envíe eventos a `/webhooks/access-control`.

**P: ¿A quién le debo contar sobre facturación fiscal?**  
R: Está fuera del MVP. Hay una interfaz lista en `PaymentProvider.handleFiscalIntegration()`. Implementar después de validación con SAT.

**P: ¿Cuál es el endpoint para crear una cuota?**  
R: `POST /api/financial/quotas` (aún por implementar en detail, ver [financial.module.ts](apps/backend/src/modules/financial/financial.module.ts))

---

**Necesidad ayuda?** Revisa el código en `apps/backend/src/` — está bien comentado.
