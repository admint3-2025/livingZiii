# ZIII Living — Quick Setup Guide

## Prerequisites

1. **Node.js 18+** — Download from https://nodejs.org
2. **npm 9+** — Comes with Node.js
3. **Docker Desktop** — Download from https://www.docker.com/products/docker-desktop
4. **Git** — Download from https://git-scm.com

---

## 🚀 First-Time Setup

### 1. Clean Install (Recommended)

If you got npm peer dependency errors, do this:

```bash
# From root directory (D:\1. Living pro ZIII)

# Delete node_modules and lock files
rmdir /s /q node_modules
rmdir /s /q apps\backend\node_modules
rmdir /s /q apps\web\node_modules
rmdir /s /q apps\mobile\node_modules
del package-lock.json

# Install with legacy peer deps flag
npm install --legacy-peer-deps

# Verify installation
npm ls
```

### 2. Verify Installation

```bash
# Check Node version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Check Docker
docker --version
docker compose version  # Should show version info (not "not found")
```

---

## 🐳 Start Infrastructure (Docker)

```bash
# Start PostgreSQL, Redis, and other containers
npm run docker:up

# Verify containers are running
docker ps

# View logs
docker compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop when done
npm run docker:down
```

---

## 🚀 Start Development Servers

### Terminal 1: Backend (Port 3000)

```bash
cd D:\1. Living pro ZIII
npm run dev:backend

# Expected output:
# [Nest] 1234  - 06/12/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 1234  - 06/12/2026, 10:00:00 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
# ...
# [Nest] 1234  - 06/12/2026, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
```

### Terminal 2: Frontend (Port 5173)

```bash
cd D:\1. Living pro ZIII
npm run dev:web

# Expected output:
# VITE v5.0.0  ready in 234 ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Terminal 3: Mobile (Port 19000, optional)

```bash
cd D:\1. Living pro ZIII
npm run dev:mobile

# Expected output:
# Expo CLI ready. You can now press:
# i - open iOS simulator
# a - open Android emulator
# w - open in web browser
```

---

## 🌐 Access Points

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| Frontend (React) | http://localhost:5173 | N/A | N/A |
| Backend API | http://localhost:3000 | N/A | N/A |
| Swagger Docs | http://localhost:3000/api | N/A | N/A |
| Database (Adminer) | http://localhost:8080 | postgres | postgres |
| PostgreSQL Direct | localhost:5432 | postgres | postgres |
| Redis | localhost:6379 | N/A | N/A |

---

## ✅ Verify Everything Works

### 1. Check Backend is Running

```bash
curl http://localhost:3000/api

# Should return Swagger JSON documentation
```

### 2. Check Frontend is Running

```bash
# Open in browser
http://localhost:5173

# Should show login page (ZIII Living Admin Portal)
```

### 3. Check Database Connection

```bash
# Open Adminer
http://localhost:8080

# Login:
# System: PostgreSQL
# Server: postgres
# User: postgres
# Password: postgres
# Database: ziii_living
```

---

## 📝 Common Issues & Fixes

### Issue: "npm error ERESOLVE could not resolve"

**Solution:**
```bash
npm install --legacy-peer-deps
```

### Issue: "docker compose" command not found

**Solution:**
- Make sure Docker Desktop is installed and running
- Restart PowerShell after installing Docker
- Use `docker-compose` (with hyphen) if on older Docker version
- Or manually start containers: `docker run -d ...`

### Issue: "nest: The term 'nest' is not recognized"

**Solution:**
```bash
# This is now fixed - scripts use "npm exec nest"
# Reinstall dependencies:
npm install
```

### Issue: Port already in use (3000, 5173, etc.)

**Solution:**
```bash
# Find and kill process using port
netstat -ano | findstr :3000
taskkill /PID {PID} /F

# Or use different port:
# Backend: set DATABASE_PORT=3001 in .env
# Frontend: modify vite.config.ts port
```

### Issue: Database connection failed

**Solution:**
```bash
# Make sure Docker containers are running
docker ps

# If not, start them:
npm run docker:up

# Check logs:
docker logs postgres
```

---

## 🔧 Environment Configuration

### Backend (.env)

```bash
# apps/backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ziii_living

JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=3600

PAYMENT_PROVIDER=mercado-pago
ACCESS_CONTROL_PROVIDER=hikvision
```

### Frontend (.env)

```bash
# apps/web/.env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 📦 Workspace Structure

```
d:\1. Living pro ZIII\
├── apps/
│   ├── backend/          # NestJS API
│   ├── web/              # React Admin Dashboard
│   └── mobile/           # React Native App
├── packages/
│   └── shared/           # Shared types & contracts
├── infrastructure/
│   └── docker/           # docker-compose.yml
├── docs/                 # Documentation
└── package.json          # Root workspace config
```

---

## 🚢 Development Workflow

```bash
# 1. Start infrastructure (Docker)
npm run docker:up

# 2. Open 3 terminals and start servers
# Terminal 1:
npm run dev:backend

# Terminal 2:
npm run dev:web

# Terminal 3 (optional):
npm run dev:mobile

# 3. Open browser
http://localhost:5173

# 4. Login with credentials (implement /auth/login first):
# Email: admin@example.com
# Password: password

# 5. When done, stop infrastructure
npm run docker:down
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design
- **[apps/backend/README.md](./apps/backend/README.md)** — Backend setup
- **[apps/web/README.md](./apps/web/README.md)** — Frontend setup
- **[Swagger API Docs](http://localhost:3000/api)** — API documentation (when backend running)

---

## ⚡ Quick Commands

```bash
# Development
npm run dev                # Start both backend & web
npm run dev:backend        # Backend only
npm run dev:web            # Frontend only
npm run dev:mobile         # Mobile only

# Build
npm run build              # Build all
npm run build:backend      # Backend only
npm run build:web          # Frontend only
npm run build:mobile       # Mobile only

# Testing
npm run test               # Run backend tests
npm run lint               # Lint code

# Database
npm run db:migrate         # Run migrations
npm run db:generate        # Generate new migration

# Docker
npm run docker:up          # Start containers
npm run docker:down        # Stop containers

# Install
npm install                # Normal install
npm install --legacy-peer-deps  # If peer dependency conflicts
```

---

## 🆘 Still Having Issues?

1. **Check Node/npm versions** — `node --version` && `npm --version`
2. **Clean install** — Delete node_modules, package-lock.json, reinstall
3. **Check Docker** — `docker ps` should show running containers
4. **Check ports** — Make sure 3000, 5173, 5432 are free
5. **Review logs** — Check terminal output for specific error messages
6. **Reinstall packages** — `npm install --legacy-peer-deps`

---

**Last Updated**: June 12, 2026  
**Status**: MVP Setup Complete ✅
