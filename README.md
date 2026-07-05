# ZIII Living — SaaS Platform for Condominium Administration

**Versión**: 0.1.0 (MVP en desarrollo)  
**Lenguaje**: TypeScript  
**Stack**: Node.js/NestJS, React, React Native, PostgreSQL

---

## 📋 Tabla de Contenidos

- [Visión y Principios](#visión-y-principios)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración Local](#instalación-y-configuración-local)
- [Comenzar a Desarrollar](#comenzar-a-desarrollar)
- [Arquitectura](#arquitectura)
- [Módulos Principales](#módulos-principales)
- [Roadmap MVP](#roadmap-mvp)
- [Contribuir](#contribuir)

---

## 🎯 Visión y Principios

**ZIII Living** es una plataforma SaaS diseñada para resolver el problema fragmentado de la administración de condominios y comunidades habitacionales:

- **Problema**: Morosidad, falta de transparencia, control de acceso desconectado del sistema administrativo
- **Solución**: Integración de cobranza en línea, estado de cuenta transparente y control de accesos vía APIs de fabricantes

### Principios de Producto

1. **Profundidad sobre amplitud**: Excelencia en *cobranza, transparencia y acceso*. No 50 módulos mediocres.
2. **Integrar, no reinventar**: Control de acceso se conecta a APIs de fabricantes (Hikvision, Dahua, etc.)
3. **Una plataforma, roles distintos**: Backend + Admin Web + Apps móviles con permisos granulares
4. **Mobile-first para residentes/guardias; Web-first para admins**
5. **Modular y pluggable**: Proveedores de pago y acceso son intercambiables
6. **Transparencia como diferenciador**: Timeline financiero, auditoría completa
7. **Onboarding en 1 día**: Objetivo MVP: cuota + invitación + QR en <24h
8. **YAGNI estricto**: Si no mejora cobranza/transparencia/accesos → fuera

---

## 📂 Estructura del Proyecto

```
ziii-living/
├── apps/
│   ├── backend/                  # NestJS API Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── organizations/
│   │   │   │   ├── properties/
│   │   │   │   ├── units/
│   │   │   │   ├── users/
│   │   │   │   ├── financial/     # Cuotas, cargos
│   │   │   │   ├── payment/       # Proveedores de pago
│   │   │   │   ├── access-control/ # Visitas, bitácora de acceso
│   │   │   │   └── audit/         # Logs de auditoría
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                       # React Admin Dashboard
│   │   ├── src/
│   │   ├── index.html
│   │   └── package.json
│   └── mobile/                    # React Native (Resident + Guard)
│       ├── src/
│       └── package.json
├── packages/
│   └── shared/                    # Tipos y contratos compartidos
│       ├── src/
│       │   ├── contracts/
│       │   │   ├── payment.provider.ts
│       │   │   └── access-control.provider.ts
│       │   └── index.ts
│       └── package.json
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── Dockerfile.backend
│   └── database/
│       └── migrations/
├── .github/
│   └── copilot-instructions.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Instalación y Configuración Local

### Requisitos

- **Node.js**: 20+
- **npm**: 9+ (o yarn/pnpm)
- **Docker & Docker Compose** (para desarrollo con base de datos)
- **PostgreSQL**: 16+ (si prefieres instalación local en lugar de Docker)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-org/ziii-living.git
cd "1. Living pro ZIII"
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores locales
```

### 3. Instalar dependencias (monorepo)

```bash
npm install
```

Esto instala dependencias para:
- `apps/backend`
- `apps/web`
- `apps/mobile`
- `packages/shared`

### 4. Iniciar Docker (PostgreSQL + Redis + Adminer)

```bash
npm run docker:up
```

✓ PostgreSQL en `localhost:5432`  
✓ Redis en `localhost:6379`  
✓ Adminer en `http://localhost:8080` (para gestionar BD)

Credenciales por defecto:
```
Usuario: ziii_user
Contraseña: ziii_password_dev
Base de datos: ziii_living_dev
```

---

## 💻 Comenzar a Desarrollar

### Opción A: Desarrollar Backend + Web en paralelo

```bash
npm run dev
```

Abre dos terminales:
- **Terminal 1**: Backend en `http://localhost:3000` + Swagger en `http://localhost:3000/api`
- **Terminal 2**: Web en `http://localhost:5173`

### Opción B: Desarrollar solo Backend

```bash
npm run dev:backend
```

El backend incluye **Swagger API Documentation** en `http://localhost:3000/api`

### Opción C: Desarrollar solo Web (React)

```bash
npm run dev:web
```

### Opción D: Desarrollar Mobile (React Native)

```bash
npm run dev:mobile
```

### Compilar Todo

```bash
npm run build
```

### Ejecutar Tests

```bash
npm run test
```

---

## 🏗️ Arquitectura

### Patrón de Proveedores (Pluggable)

La arquitectura de ZIII Living usa un patrón de **proveedores intercambiables** para integraciones externas:

#### 1. **PaymentProvider** — Cobranza en línea

```typescript
interface PaymentProvider {
  id: string;
  name: string;
  validateCredentials(config): Promise<boolean>;
  createPaymentRequest(request): Promise<PaymentResponse>;
  getPaymentStatus(transactionId): Promise<PaymentStatus>;
  refundPayment(transactionId, amount?): Promise<boolean>;
  handleWebhook(payload): Promise<void>;
  getCommissionInfo(amount): Promise<{ commission, net }>;
}
```

**Proveedores soportados (v1)**:
- Mercado Pago
- Stripe
- Conekta
- SPEI (proveedor local MX)

**Ubicación**: [packages/shared/src/contracts/payment.provider.ts](packages/shared/src/contracts/payment.provider.ts)

#### 2. **AccessControlProvider** — Integración con hardware de acceso ⭐

```typescript
interface AccessControlProvider {
  id: string;
  name: string;
  validateCredentials(config): Promise<boolean>;
  createVisitorPass(request): Promise<VisitorPass>;
  revokePass(passId): Promise<void>;
  syncAccessEvents(since): Promise<AccessEvent[]>;
  registerWebhook?(url, events?): Promise<void>;
  handleWebhook?(payload): Promise<AccessEvent | null>;
  getStatus(): Promise<{ connected, lastSync?, message? }>;
}
```

**Proveedores soportados (v1)**:
- Hikvision (prioridad)
- Dahua (prioridad)
- ZKTeco
- Suprema
- HID

**Ubicación**: [packages/shared/src/contracts/access-control.provider.ts](packages/shared/src/contracts/access-control.provider.ts)

### Modelo de Datos (Entidades TypeORM)

| Entidad | Descripción |
|---------|-------------|
| `Organization` | Administración/empresa que gestiona propiedades |
| `Property` | Condominio, edificio, desarrollo habitacional |
| `Unit` | Unidad individual (departamento, casa) |
| `User` | Residente, admin, guardia, visitante |
| `Quota` | Cuota ordinaria/extraordinaria |
| `Charge` | Cargo adicional (multa, interés, servicio) |
| `PaymentRecord` | Registro de pago (qué se pagó, cuándo, con qué proveedor) |
| `VisitInvitation` | Invitación de visitante → acceso temporal |
| `AccessEvent` | Bitácora de eventos de acceso (entrada, salida, denegado) |
| `AuditLog` | Log de quién hizo qué y cuándo |

**Ubicación**: `apps/backend/src/modules/*/entities/`

---

## 📦 Módulos Principales

### 1. **Organizations Module**
Gestión de organizaciones (administraciones, propiedades múltiples)

- Crear/editar/listar organizaciones
- Configurar proveedores de pago y acceso por organización
- Roles y permisos

### 2. **Properties Module**
Gestión de propiedades (condominios, edificios)

- Crear/editar/listar propiedades
- Asignar proveedor de acceso por propiedad
- Configurar puertas/torniquetes disponibles

### 3. **Units Module**
Gestión de unidades (departamentos, casas)

- Crear/editar/listar unidades
- Asignar residentes

### 4. **Users Module**
Gestión de usuarios con roles y permisos

- Crear residentes, admins, guardias, visitantes
- Autenticación JWT
- Permisos granulares

### 5. **Financial Module** ⭐
Núcleo de cobranza

- Crear cuotas ordinarias/extraordinarias
- Crear cargos (multas, intereses, descuentos)
- Generar estado de cuenta por unidad
- Reportes de ingresos/egresos

### 6. **Payment Module** ⭐
Integración de proveedores de pago

- Crear solicitud de pago
- Gestionar webhooks de proveedores
- Conciliación automática
- Comisiones transparentes

### 7. **Access Control Module** ⭐
Control de acceso integrado

- Crear invitaciones de visitante
- Generar QR/código de acceso
- Sincronizar eventos de acceso desde hardware
- Bitácora en tiempo real
- Modo fallback (guardia valida QR si hardware no responde)

### 8. **Audit Module**
Transparencia completa

- Log de todas las acciones (crear, editar, eliminar, aprobar, pagar)
- Quién, qué, cuándo, dónde
- Trazabilidad financiera

---

## 🗓️ Roadmap MVP (8–12 semanas)

### Semana 1–2: Setup y Base
- ✅ Monorepo setup (Docker, TypeORM, NestJS)
- ✅ Modelos de datos
- ✅ Contratos de proveedores
- Autenticación JWT
- Endpoints básicos (CRUD) para Organizations, Properties, Units

### Semana 3–4: Módulo Financiero
- Crear cuotas ordinarias/extraordinarias
- Crear cargos (multas, intereses, condonaciones)
- Estado de cuenta por unidad
- Reportes básicos (ingresos/egresos, morosidad)

### Semana 5–6: Cobranza en Línea
- Implementar **1 proveedor** (Mercado Pago recomendado)
- Flujo: cuota → link de pago → webhook → conciliación
- Comisiones transparentes
- Dashboard de pagos

### Semana 7–8: Control de Acceso ⭐
- Implementar **1 proveedor** (Hikvision o Dahua)
- Módulo de visitantes (crear invitación → QR → validación guardia)
- Bitácora de accesos
- Sincronización de eventos desde hardware

### Semana 9–10: Audit & Transparencia
- Timeline financiero
- Auditoría de acciones
- Estado de cuenta en formato legible
- Reportes de transparencia

### Semana 11–12: MVP Polish + Deploy
- Web Admin Dashboard (CRUD básico)
- App móvil para residentes (ver estado de cuenta, pagar)
- App móvil para guardias (validar visitantes, bitácora)
- Testing
- Documentación

---

## 🔌 Integraciones Próximas (Post-MVP)

- [ ] Facturación fiscal (SAT México, CFDI 4.0) — **desacoplado, interface definida**
- [ ] Nómina y contabilidad
- [ ] Pagos recurrentes y domiciliación
- [ ] Reportes avanzados
- [ ] Más proveedores de pago y acceso
- [ ] Sincronización de WhatsApp/Telegram

---

## 📝 Desarrollar un Nuevo Proveedor de Pago

### Ejemplo: Integrar nuevo proveedor de pago

```typescript
// apps/backend/src/providers/my-provider.payment.ts
import { PaymentProvider, PaymentRequest, PaymentResponse } from '@shared/contracts/payment.provider';

export class MyProviderPayment implements PaymentProvider {
  id = 'my_provider';
  name = 'Mi Proveedor';

  async validateCredentials(config) {
    // Conectar a API, validar credenciales
    return true;
  }

  async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    // Crear solicitud de pago
    return {
      transactionId: '...',
      status: 'pending',
      paymentUrl: '...',
      // ...
    };
  }

  // Implementar otros métodos...
}
```

Registrar en `PaymentModule`:

```typescript
@Module({
  providers: [
    {
      provide: 'MyProviderPayment',
      useFactory: () => new MyProviderPayment(),
    },
  ],
})
export class PaymentModule {}
```

---

## 📝 Desarrollar un Nuevo Proveedor de Acceso

### Ejemplo: Integrar nuevo fabricante de acceso

```typescript
// apps/backend/src/providers/my-access-provider.ts
import { AccessControlProvider, VisitorPassRequest, VisitorPass } from '@shared/contracts/access-control.provider';

export class MyAccessProvider implements AccessControlProvider {
  id = 'my_access_provider';
  name = 'Mi Fabricante';

  async validateCredentials(config) {
    // Conectar a API del fabricante, validar
    return true;
  }

  async createVisitorPass(request: VisitorPassRequest): Promise<VisitorPass> {
    // Generar QR, NFC, PIN según lo que el fabricante soporta
    return {
      id: '...',
      qrCode: '...',
      validFrom: request.validFrom,
      validUntil: request.validUntil,
      // ...
    };
  }

  // Implementar syncAccessEvents, handleWebhook, etc.
}
```

---

## 🐛 Debugging

### Ver logs del backend

```bash
npm run dev:backend
```

Los logs aparecen en consola con nivel configurable en `.env` (`LOG_LEVEL=debug`)

### Acceder a Adminer (UI para PostgreSQL)

```
http://localhost:8080
```

- Server: `postgres`
- Username: `ziii_user`
- Password: `ziii_password_dev`
- Database: `ziii_living_dev`

### Ver estado de Redis

```bash
docker exec ziii_redis redis-cli
> PING
PONG
```

---

## 📞 Contacto y Contribución

Este es un proyecto privado. Para contribuir:

1. Clona una rama feature: `git checkout -b feature/nueva-integracion`
2. Comitea cambios siguiendo convenciones
3. Abre un pull request
4. Code review + merge

---

## 📄 Licencia

Uso privado — ZIII Living. Todos los derechos reservados.

---

**Última actualización**: Junio 2024  
**Estado**: MVP en desarrollo
