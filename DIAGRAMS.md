# ZIII Living — Visual Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ZIII Living Platform                             │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌────────────┐  ┌────────────┐  ┌────────────┐
                    │  Web Admin │  │  Mobile    │  │  Mobile    │
                    │  (React)   │  │  Resident  │  │   Guard    │
                    │            │  │(React N.)  │  │ (React N.) │
                    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
                           │               │               │
                           └───────────────┼───────────────┘
                                           │
                          ┌────────────────▼────────────────┐
                          │   ZIII Living API (NestJS)      │
                          │   http://localhost:3000         │
                          ├────────────────────────────────┤
                          │  ┌─────────────────────────────┤
                          │  │ Organizations Module         │
                          │  │ Properties Module            │
                          │  │ Units Module                 │
                          │  │ Users Module (Auth/RBAC)     │
                          │  │ Financial Module (Cuotas)    │
                          │  │ Payment Module               │
                          │  │ Access Control Module        │
                          │  │ Audit Module (Logs)          │
                          │  └─────────────────────────────┤
                          └────────┬──────────────┬─────────┘
                                   │              │
                    ┌──────────────┘              └──────────────┐
                    │                                             │
         ┌──────────▼──────────┐                  ┌──────────────▼──────────┐
         │  PostgreSQL (16)    │                  │  Redis (Cache/Queue)   │
         │  - Organizations    │                  │  - Sessions            │
         │  - Properties       │                  │  - Rate limiting       │
         │  - Units            │                  │  - Task queue          │
         │  - Users            │                  │  - Real-time events    │
         │  - Quotas           │                  └────────────────────────┘
         │  - Charges          │
         │  - Payments         │
         │  - Access Events    │
         │  - Audit Logs       │
         └─────────────────────┘
```

---

## Data Model Hierarchy

```
Organization
├── Properties
│   ├── Units
│   │   ├── Users (Residents)
│   │   ├── Quotas
│   │   ├── Charges
│   │   ├── PaymentRecords
│   │   └── VisitInvitations
│   └── AccessEvents
├── Users (Admin, Manager, Guards)
└── AuditLogs
```

---

## Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Resident App                                                 │
│  - Sees outstanding quota: $2,500                             │
│  - Clicks "Pagar Ahora"                                       │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend API (Payment Module)                                 │
│  - Create PaymentRequest                                      │
│  - Call PaymentProvider.createPaymentRequest()                │
│  - Return paymentUrl (link to Mercado Pago)                   │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Mercado Pago (Payment Provider)                              │
│  - Resident completes payment                                 │
│  - Payment confirmed                                          │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Webhook (Mercado Pago → Backend)                             │
│  - Backend receives payment confirmation                      │
│  - Update PaymentRecord status = APPROVED                     │
│  - Update Quota status = PAID                                 │
│  - Create AuditLog entry                                      │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Resident App (Real-time update)                              │
│  - See "Pagado" on quota                                      │
│  - Updated state of account                                   │
│  - Payment appears in timeline                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Access Control Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Resident App                                                 │
│  - Creates visitor invitation                                 │
│  - Name: "Juan Garcia"                                        │
│  - Valid: 2024-06-15 14:00 → 18:00                            │
│  - Unit: 101                                                  │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend API (Access Control Module)                          │
│  - Create VisitInvitation in DB                               │
│  - Call AccessControlProvider.createVisitorPass()             │
│  - Generate QR code                                           │
│  - Return QR to resident                                      │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Resident                                                     │
│  - Shares QR with visitor (photo/WhatsApp)                    │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Visitor Arrives at Gate                                      │
│  - Guard scans QR code                                        │
│  - Guard app validates with Backend                           │
│  - Backend checks: time valid? unit matches? status active?   │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Gate Hardware (Hikvision/Dahua)                              │
│  - Unlock door / Raise barrier                                │
│  - Send access event to Backend (webhook)                     │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend (Access Events)                                      │
│  - Receive event: "entry successful"                          │
│  - Create AccessEvent record                                  │
│  - Update VisitInvitation status = "used"                     │
│  - Create AuditLog entry                                      │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  Resident App (Timeline)                                      │
│  - See "Visitor Juan Garcia entered at 14:05"                 │
│  - Real-time notification                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## State of Account (Transparency)

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIT 101 - ESTADO DE CUENTA               │
│                    Marzo 2024                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ SALDO ANTERIOR                               $1,500.00      │
│                                                              │
│ MOVIMIENTOS MARZO:                                           │
│ ├─ Cuota Ordinaria                           $2,500.00      │
│ ├─ Multa (retraso febrero)                   $  250.00      │
│ ├─ Pago recibido (Mercado Pago 15/mar)     ($2,000.00)     │
│ └─ Descuento pronto pago (5%)              ($  125.00)     │
│                                                              │
│ SALDO ACTUAL                                 $2,125.00      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ PRÓXIMA CUOTA: 30 Abril 2024                 $2,500.00      │
├─────────────────────────────────────────────────────────────┤
│ Ver documento en PDF   |   Ver timeline completo            │
└─────────────────────────────────────────────────────────────┘

Timeline (for transparency):
├─ 01/mar 10:00 | Cuota ordinaria creada por admin
├─ 03/mar 14:30 | Interés agregado (mora)
├─ 15/mar 09:45 | Pago de $2,000 recibido (Mercado Pago)
├─ 15/mar 10:01 | Descuento pronto pago aplicado
├─ 15/mar 10:02 | Estado de cuenta actualizado
└─ ...
```

---

## Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────┐
│ Role      │ Can View | Can Create | Can Approve | Can Pay   │
├─────────────────────────────────────────────────────────────┤
│ ADMIN     │ All      │ All        │ All         │ All       │
│ MANAGER   │ Property │ Quotas     │ Quotas      │ N/A       │
│ RESIDENT  │ Own Unit │ Visits     │ N/A         │ Own Quota │
│ GUARD     │ Visits   │ N/A        │ Visits      │ N/A       │
│ VISITOR   │ Limited  │ N/A        │ N/A         │ N/A       │
│ STAFF     │ Logs     │ N/A        │ N/A         │ N/A       │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Pattern Architecture

```
PaymentProvider Interface
├── Mercado Pago Implementation
│   ├── API: https://api.mercadopago.com
│   ├── Webhook: POST /webhooks/mercado-pago
│   └── Methods: createPaymentRequest, handleWebhook, getCommissions
├── Stripe Implementation
│   ├── API: https://api.stripe.com
│   ├── Webhook: POST /webhooks/stripe
│   └── Methods: createPaymentRequest, handleWebhook, getCommissions
└── ... (Others)

AccessControlProvider Interface
├── Hikvision Implementation
│   ├── API: https://{host}:8080/ISAPI
│   ├── Webhook: POST /webhooks/hikvision
│   └── Methods: createVisitorPass, syncAccessEvents, handleWebhook
├── Dahua Implementation
│   ├── API: https://{host}/api
│   ├── Webhook: POST /webhooks/dahua
│   └── Methods: createVisitorPass, syncAccessEvents, handleWebhook
└── ... (Others)
```

---

## Audit Trail Example

```
timestamp        | actor           | action   | entity  | oldValues      | newValues
────────────────────────────────────────────────────────────────────────────────────
2024-06-15 10:00 | admin           | CREATE   | Quota   | -              | {amount: 2500}
2024-06-15 10:05 | system          | UPDATE   | Quota   | {status: P}    | {status: OVD}
2024-06-15 14:30 | juan@mail.com   | CREATE   | Payment | -              | {id: mp_123}
2024-06-15 14:31 | mercado_pago_   | UPDATE   | Payment | {status: PEND} | {status: APPR}
2024-06-15 14:32 | system          | UPDATE   | Quota   | {status: OVD}  | {status: PD}
2024-06-15 14:32 | system          | CREATE   | AuditLog| -              | {all above}
```

---

## Deployment Architecture (Future)

```
┌──────────────────────────────────────────────────────────────┐
│                   AWS / Digital Ocean / etc                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Load Balancer (CloudFront / nginx)                     │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│     ┌─────────────┼─────────────┐                           │
│     │             │             │                           │
│  ┌──▼──┐      ┌──▼──┐      ┌──▼──┐                         │
│  │ Pod │      │ Pod │      │ Pod │  (Auto-scaling)        │
│  │  1  │      │  2  │      │  3  │                         │
│  └──┬──┘      └──┬──┘      └──┬──┘                         │
│     │           │             │                            │
│     └───────────┼─────────────┘                            │
│                 │                                           │
│         ┌───────▼────────────┐                             │
│         │ PostgreSQL (RDS)   │                             │
│         │ - Multi-AZ         │                             │
│         │ - Backups          │                             │
│         │ - Monitoring       │                             │
│         └────────────────────┘                             │
│                                                             │
│         ┌────────────────────┐                             │
│         │ Redis Cluster      │                             │
│         │ - Sessions         │                             │
│         │ - Cache            │                             │
│         └────────────────────┘                             │
│                                                             │
└──────────────────────────────────────────────────────────────┘
```

---

**All diagrams are ASCII art for easy version control and documentation.**
