# 📊 StockSense — Modern Inventory Management System

StockSense is an enterprise-grade, real-time Inventory Management System designed as a high-performance **modular monolith**. It eliminates manual paper registers, scattered spreadsheets, and inventory drift with strict **double-entry ledger accounting**, automated low-stock alerting, and warehouse topology tracking.

-----

## 🌟 Key Architecture & Technical Highlights

- **Modular Monolith**: Clean domain boundary separation under `src/modules/*` (`auth`, `ledger`, `products`, `warehouses`, `operations`, `dashboard`).
- **Strict Double-Entry Stock Ledger**:
  - Current stock is never stored as a mutable counter; it is dynamically calculated via `SUM(quantityDelta)`.
  - Negative stock prevention: Delivery orders and transfers strictly enforce availability checks prior to execution.
  - Complete, immutable audit trail for every stock movement.
- **Role-Based Access Control (RBAC)**:
  - `MANAGER`: Full operational authority, product management, physical adjustments, and warehouse settings.
  - `STAFF`: Operational execution (receipt validations, delivery fulfillment, transfer dispatches).
- **Self-Contained Security**:
  - HTTP-only signed JWT session cookies using `jose`.
  - Salted password hashing using `bcryptjs`.
  - In-memory time-bound OTP flow for password reset.
- **Glassmorphic UI Design System**:
  - Built with Tailwind CSS, Next.js 14 App Router, Lucide icons, responsive drawer modals, interactive notifications, and metric cards.

---

## 🏗️ Domain Modules & Folder Structure

```
StockSense/
├── prisma/
│   ├── schema.prisma          # PostgreSQL Schema with relations, enums & indexes
│   └── seed.ts                # Seeder for demo users, warehouses, locations & stock
├── scripts/
│   └── verify_system.ts       # Automated 19-test domain verification suite
├── src/
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (auth)/            # /login, /register, /reset-password
│   │   ├── (dashboard)/       # /, /products, /products/[id], /operations/*, /move-history, /settings, /profile
│   │   └── api/               # 25+ RESTful JSON API endpoints
│   ├── components/
│   │   ├── layout/            # Sidebar, Topbar, UserMenu, DashboardShell
│   │   └── ui/                # Button, Input, Select, Badge, Modal, Drawer, Toast
│   ├── lib/                   # prisma, password, formatters, validators
│   ├── middleware.ts          # Edge authentication guard & RBAC redirection
│   └── modules/               # Core business domains (auth, ledger, products, operations, dashboard)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** 18+ (tested on Node.js 20 & 22)
- **PostgreSQL** 14+ running locally or remotely

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/stocksense?schema=public"
JWT_SECRET="your-secure-secret-key-32-chars-minimum"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Migration & Seeding
Push the Prisma schema to create all tables, enums, and relations, then seed initial data:
```bash
npx prisma db push
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@stocksense.com` | `Password123!` | Full Admin / Ledger / Topology / Adjustments |
| **Logistics Staff** | `staff@stocksense.com` | `Password123!` | Inbound Receipts, Outbound Deliveries, Transfers |

---

## 🧪 Automated Verification Suite

StockSense includes an end-to-end automated verification script testing all 19 domain requirements:

```bash
npx tsx scripts/verify_system.ts
```

### Verified Test Matrix:
1. **Auth & Security**: Manager/Staff role verification, password hashing, 6-digit OTP dispatch.
2. **Product & Topology**: Category relations, per-location breakdown, dynamic stock aggregation.
3. **Core Ledger Engine**: Strict `SUM(quantityDelta)` derivation, immutability check.
4. **Inbound Receipts**: Status lifecycle (`DRAFT` → `READY` → `DONE`), ledger stock credit (+ delta).
5. **Outbound Deliveries**: Over-allocation negative stock prevention, ledger depletion (- delta).
6. **Internal Transfers**: Dual-entry atomic movement (- at origin, + at destination).
7. **Stock Adjustments**: Cycle count variance reconciliation and audit ledger trace.
8. **Dashboard Telemetry**: Real-time KPI aggregation, inventory valuation, and stock alerts.

---

## 📦 Production Build

```bash
npm run build
npm run start
```
Verified with 0 TypeScript and lint errors across 32 static and dynamic routes.
