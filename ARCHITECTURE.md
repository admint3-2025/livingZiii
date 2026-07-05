# ARCHITECTURE DECISION RECORDS (ADR)

## ADR-001: Provider Pattern for External Integrations

**Status**: ACCEPTED

**Decision**: Use provider pattern (interfaces/adapters) for payment and access control integrations

**Rationale**:
- Allows multiple implementations (Mercado Pago, Stripe, Hikvision, Dahua, etc.)
- Provider-agnostic core business logic
- Easy to swap implementations
- Testable (mock providers in tests)

**Implementation**:
- `PaymentProvider` interface in `packages/shared/src/contracts/payment.provider.ts`
- `AccessControlProvider` interface in `packages/shared/src/contracts/access-control.provider.ts`
- Each provider implementation is a separate service in `apps/backend/src/providers/`

**Consequences**:
- Good: Flexibility, extensibility
- Concern: More abstraction layers (mitigated by clear documentation)

---

## ADR-002: One Platform with Role-Based Access Control

**Status**: ACCEPTED

**Decision**: Single codebase with granular roles/permissions instead of separate products

**Rationale**:
- Unified data model
- Easier to maintain and evolve
- Single-sign-on and audit trail
- Cost-effective

**Roles**:
- `admin` — Full access to organization
- `manager` — Property management
- `resident` — See own unit and financial data
- `guard` — Validate visitors, see bitácora
- `visitor` — Limited temporary access
- `staff` — Support staff

**Consequences**:
- Good: Data consistency, simpler architecture
- Concern: More complex auth logic (mitigated by clear permission matrix)

---

## ADR-003: Financial Module Separation from Payment Processing

**Status**: ACCEPTED

**Decision**: Financial module (cuotas, cargos, estado de cuenta) is independent of payment processing

**Rationale**:
- Financial state is source of truth
- Payment processing is asynchronous
- Easier to audit and reconcile

**Flow**:
1. Create Quota (financial module)
2. Resident initiates payment (payment module)
3. Payment provider processes
4. Webhook updates PaymentRecord
5. Financial module reconciles

**Consequences**:
- Good: Clear separation of concerns
- Concern: Need careful webhook handling (implemented with idempotency)

---

## ADR-004: Visitor Management as Access Control Foundation

**Status**: ACCEPTED

**Decision**: Visitor invitations are the primary mechanism for temporary access

**Rationale**:
- Transparent (resident controls who enters)
- Auditable (every visit is logged)
- Scalable (QR-based, no physical changes)
- Integrates with hardware via provider pattern

**Components**:
- `VisitInvitation` entity (ZIII-side)
- `AccessControlProvider.createVisitorPass()` → generates QR/NFC/PIN
- `AccessEvent` bitácora (every entry/exit/denial logged)

**Consequences**:
- Good: Clear audit trail, flexible
- Concern: Fallback needed if hardware unavailable (guard validation app handles this)

**Current Hikvision validation**:
- Model verified on network: `DS-K1T341CMFW`
- ISAPI reachable on `192.168.100.96`
- Device capabilities report QR support and Hik-Connect binding
- QR authentication appears to be a device/platform setting rather than a purely local ZIII feature

---

## ADR-005: Audit Trail for Complete Transparency

**Status**: ACCEPTED

**Decision**: Every action (create, update, delete, approve, pay) is logged with actor, timestamp, IP, user-agent

**Rationale**:
- Transparency as differentiator
- Regulatory compliance (audit)
- Dispute resolution
- Trust building

**Implementation**:
- `AuditLog` entity
- Interceptors/decorators in controllers
- Timeline view in frontend (for residents, show all movements affecting their account)

**Consequences**:
- Good: Full traceability
- Concern: Storage overhead (mitigated by partitioning, archiving)

---

## ADR-006: PostgreSQL as Primary Database

**Status**: ACCEPTED

**Rationale**:
- Robust for financial data
- ACID compliance
- JSON support for flexibility
- Cost-effective open source

**Alternatives Considered**:
- MongoDB: Too flexible for financial data, harder to maintain referential integrity
- MySQL: PostgreSQL has better JSON support and advanced features

---

## ADR-007: Docker Compose for Local Development

**Status**: ACCEPTED

**Services**:
- PostgreSQL (database)
- Redis (caching, sessions, queue)
- Adminer (web UI for DB management)

**Rationale**:
- One-command setup (docker-compose up)
- No local DB installation needed
- Mirrors production environment

**Alternatives Considered**:
- Docker Desktop with separate containers: More manual, error-prone
- Local system DB: Not everyone has PostgreSQL/Redis installed

---

## Future ADRs

- ADR-008: Facturación Fiscal (Post-MVP)
- ADR-009: Nómina Integration (Post-MVP)
- ADR-010: Mobile Offline-First Architecture (To define)
