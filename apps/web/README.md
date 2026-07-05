# ZIII Living — React Web Admin Dashboard

## Overview
This is the admin dashboard for ZIII Living — built with React, TypeScript, and Vite.

**Features**:
- User authentication (JWT-based)
- Organization management
- Property/Unit management
- Financial dashboard (quotas, charges, payments)
- Real-time access control integration
- Responsive design

---

## Quick Start

### 1. Install Dependencies
```bash
cd apps/web
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 3. Run Development Server
```bash
npm run dev
```

Navigate to: `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

---

## Project Structure

```
apps/web/src/
├── components/
│   ├── layout/       # Layout, Navbar, Sidebar
│   └── common/       # Reusable components (ProtectedRoute, etc.)
├── pages/            # Page components (Login, Dashboard, etc.)
├── services/         # API client, Auth service
├── hooks/            # Custom hooks (useAuth, useApi)
├── store/            # Zustand stores (Auth state)
├── types/            # TypeScript types & interfaces
├── styles/           # CSS files (global, layout, login, etc.)
├── App.tsx           # Main app component with routing
└── main.tsx          # Entry point
```

---

## Architecture

### Services
- **api-client.ts**: Axios instance with interceptors
- **auth.service.ts**: Login, logout, token management
- **organization.service.ts**: CRUD for organizations
- **property.service.ts**: CRUD for properties

### State Management
- **Zustand** for auth state (lightweight & simple)
- Services for API calls

### Hooks
- **useAuth**: Get current user, login, logout
- **useApi**: Generic hook for API calls (GET, POST, PUT, DELETE)

### Authentication Flow
```
1. User enters email/password in LoginPage
2. authService.login() calls POST /api/auth/login
3. Response includes accessToken + user object
4. Both stored in localStorage
5. ApiClient interceptor adds token to requests
6. ProtectedRoute checks auth before rendering
7. 401 response → clear storage & redirect to login
```

---

## Pages

| Page | Path | Protected | Notes |
|------|------|-----------|-------|
| Login | `/login` | No | Entry point |
| Dashboard | `/dashboard` | Yes | Stats & quick links |
| Organizations | `/organizations` | Yes | List, create, edit orgs |
| Properties | `/properties` | Yes | WIP |
| Units | `/units` | Yes | WIP |
| Quotas | `/quotas` | Yes | WIP |
| Payments | `/payments` | Yes | WIP |
| Access Control | `/access-control` | Yes | WIP |

---

## Styling

- **global.css**: Base styles, utility classes
- **layout.css**: Navbar, sidebar, layout structure
- **login.css**: Login page styles
- **dashboard.css**: Dashboard card grid
- **list.css**: Table & list page styles

CSS Variables:
```css
--primary-color: #2563eb
--secondary-color: #64748b
--success-color: #16a34a
--danger-color: #dc2626
--warning-color: #ea580c
--bg-color: #f8fafc
--card-bg: #ffffff
--border-color: #e2e8f0
--text-color: #1e293b
--text-muted: #64748b
```

---

## API Integration

### Example: Fetch Organizations
```typescript
import { useApi } from '@/hooks/useApi';
import { Organization } from '@/types';

const { data, loading, error, execute } = useApi<Organization[]>();

useEffect(() => {
  execute('get', '/organizations');
}, [execute]);
```

### Example: Create Organization
```typescript
const handleCreate = async () => {
  try {
    await execute('post', '/organizations', {
      name: 'My Organization',
      email: 'admin@example.com'
    });
    // Refresh list
    execute('get', '/organizations');
  } catch (err) {
    console.error(err);
  }
};
```

---

## Authentication

### Check if User is Logged In
```typescript
const { isAuthenticated, user } = useAuth();

if (isAuthenticated) {
  console.log(`Welcome ${user?.firstName}!`);
}
```

### Login Example
```typescript
const { login, loading, error } = useAuth();

const handleLogin = async (email: string, password: string) => {
  try {
    await login(email, password);
    navigate('/dashboard');
  } catch (err) {
    console.error('Login failed:', err);
  }
};
```

### Logout
```typescript
const { logout } = useAuth();
logout(); // Clears state & localStorage
```

---

## Responsive Design

- **Desktop**: 3-4 column layouts, full sidebar
- **Tablet**: 2-3 column layouts, collapsible sidebar
- **Mobile**: Single column, hamburger menu (implement if needed)

---

## Development Tips

### Hot Module Replacement (HMR)
Vite automatically reloads on file changes. No manual refresh needed.

### Format Code
```bash
npx prettier --write src
```

### Type Checking
```bash
npm run type-check
```

### Common Issues

**Port 5173 already in use?**
```bash
# Kill process using port 5173
netstat -ano | findstr :5173
taskkill /PID {PID} /F
```

**API calls failing?**
1. Check backend is running: `npm run dev:backend`
2. Check proxy in `vite.config.ts`: `/api → http://localhost:3000`
3. Check token in localStorage: DevTools → Application → LocalStorage

---

## Next Steps

- [ ] Implement Properties page
- [ ] Implement Units page
- [ ] Implement Quotas list & create form
- [ ] Implement Payments page with status tracking
- [ ] Implement Access Control visitor management
- [ ] Add user management (create users, assign roles)
- [ ] Add reports & analytics
- [ ] Deploy to staging/production

---

## Deployment

### Build
```bash
npm run build
```

Creates optimized bundle in `dist/`

### Deploy to Vercel (Recommended for React)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

**Last Updated**: June 2024  
**Status**: MVP Phase (Pages: 30% complete)
