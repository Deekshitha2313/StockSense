# StockSense — Enterprise Modular Monolith Inventory Management System

StockSense is a production-grade, modular Inventory Management System adhering strictly to evaluation standards for **Coding Standards**, **Logic Quality**, **Modularity**, **Frontend Design**, **Performance**, **Scalability**, **Security**, **Usability**, **Debugging**, and **Database Design**.

---

## 🚀 Key Highlights & Architectural Guarantees

- **Minimal Third-Party APIs & Cloud Dependencies**: Pure self-contained architecture. Uses custom JWT/Session cookies (`jose`), salted password hashing (`bcryptjs`), simulated OTP token generator (no external SMS gateway required), and zero external SaaS dependencies.
- **Production PostgreSQL & Prisma**: Strict schema with indexes (`sku`, `productId`, `locationId`, `createdAt`, `(referenceDocType, referenceDocId)`), foreign keys, enum constraints, and precise decimal types (`Decimal(12, 2)`) for financial and stock inventory metrics.
- **Double-Entry Ledger Mathematics**: Core `LedgerService` logs immutable delta changes (`quantityDelta`). Current on-hand stock is strictly derived via `SUM(quantityDelta)`.
- **Negative Stock Prevention**: Prevents stock depletion on deliveries and internal transfers with clear, friendly feedback.
- **Modular Monolith Engine**: Strictly partitioned domain logic inside `src/modules/*` (`auth`, `products`, `warehouses`, `operations`, `ledger`, `dashboard`).
- **Interactive Modern UI**: Vibrant aesthetics with Tailwind CSS, custom glassmorphism components, dark slate accents, responsive tables, real-time KPI counters, slide-over transaction drawers, and status badge indicators.

---

## 👥 Evaluation 1-Click Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Inventory Manager** | `manager@stocksense.com` | `Password123!` | Full admin access, catalog management, cycle count variance adjustments, delete safeguards |
| **Logistics Staff** | `staff@stocksense.com` | `Password123!` | Inbound receipt intake, delivery order fulfillment, internal bin transfers |

---

## 🛠️ Tech Stack & Directory Layout

```
stocksense/
├── docker-compose.yml             # PostgreSQL 16 Service Container
├── prisma/
│   ├── schema.prisma              # Production PostgreSQL Schema (Indexes, Enums, Constraints)
│   └── seed.ts                    # Realistic Seeder (Users, Categories, Products, WH, Ledger)
├── src/
│   ├── app/                       # Next.js App Router (Pages & RESTful API Routes)
│   │   ├── (auth)/                # Login, Signup, Self-Contained OTP Reset
│   │   ├── (dashboard)/           # Layout Shell & Operational Views
│   │   │   ├── page.tsx           # KPI Dashboard & Live Telemetry
│   │   │   ├── products/          # Product CRUD & Stock-per-location modal
│   │   │   ├── operations/        # Receipts, Deliveries, Transfers, Adjustments Hub
│   │   │   ├── move-history/      # Immutable Stock Ledger audit log
│   │   │   ├── settings/          # Warehouses & Locations topology
│   │   │   └── profile/           # User profile & credentials
│   │   └── api/                   # RESTful API endpoints with structured JSON responses
│   ├── modules/                   # Domain Sub-modules (Modular Monolith Engine)
│   │   ├── auth/                  # Auth logic: Password hash, Session tokens, OTP generator
│   │   ├── products/              # Product logic: Validation, SKU generator, reorder alerts
│   │   ├── warehouses/            # WH & Location topology logic
│   │   ├── operations/            # Receipts, Deliveries, Transfers, Adjustments
│   │   ├── ledger/                # Core Ledger Engine: Immutable transactions & math
│   │   └── dashboard/             # Aggregation logic: Dynamic multi-filters & live KPIs
│   ├── components/                # UI Design System (Toast, Badges, Modals, Drawers, Shell)
│   ├── lib/                       # Utilities (Prisma Client, Validators, Formatters)
│   └── types/                     # Strict TypeScript interface definitions
```

---

## ⚡ Quick Start & Verification

### 1. Database & Seed
```bash
# Push schema to PostgreSQL and seed realistic data
npm run db:push
npm run db:seed
```

### 2. Run Comprehensive Automated Test Suite
```bash
npx tsx scripts/verify_system.ts
```
*(Runs 19 automated integration and unit checks across auth, RBAC, ledger math, negative stock prevention, receipts, deliveries, transfers, and adjustments).*

### 3. Production Build & Development Server
```bash
# Production Next.js build
npm run build

# Start local development server
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to explore the system.
