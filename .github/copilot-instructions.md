# ZIII Living — Copilot Instructions

## Project Overview
- **Name**: ZIII Living
- **Type**: SaaS Monorepo (Backend, Web, Mobile)
- **Stack**: Node.js/TypeScript, NestJS, React, React Native, PostgreSQL
- **Purpose**: Condominium and community administration platform

## Principles
1. **Depth over breadth**: Core features (cobranza, control de accesos, transparencia)
2. **Integrate, don't reinvent**: Payment providers and access control via existing APIs
3. **One platform, multiple roles**: Single codebase with granular permissions
4. **Mobile-first for residents/guards; Web-first for admins**
5. **Pluggable architecture**: Payment and access control providers as interfaces

## Key Modules (MVP)
- Financial module (cuotas, cargos, estado de cuenta)
- Online cobranza (Mercado Pago, Stripe, etc.)
- Access control integration (Hikvision, Dahua)
- Visitor management and QR system
- Audit trail and transparency

## Development Rules
- Use TypeScript strictly
- Follow NestJS modular architecture
- Implement provider patterns for external integrations
- Prioritize MVP: if it doesn't improve cobranza, transparencia, or accesos, it's out
- Document contracts/interfaces before implementing
