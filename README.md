# Nepal CRM — MVP

A modern, full-stack CRM built for small and medium businesses in Nepal.
Track customers, sales, payments, dues, and inventory from one clean dashboard.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Prisma · SQLite (local) / PostgreSQL (production) · NextAuth

---

## Quick Start (5 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# The default .env uses SQLite — no database server needed for local dev
```

### 3. Run database migrations and seed

```bash
npm run db:push      # Apply schema to SQLite
npm run db:seed      # Insert demo data (users, customers, products, sales)
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role  | Email            | Password     |
|-------|------------------|--------------|
| Admin | admin@demo.com   | password123  |
| Staff | ram@demo.com     | staff123     |

---

## Features

### Core Modules

| Module       | Features |
|--------------|----------|
| **Auth**     | Login, register, JWT sessions, role-based access (Admin / Staff) |
| **Dashboard**| Stats cards, interactive chart (Sales / Payments / Inventory), recent activity |
| **Customers**| CRUD, search/filter, purchase history, outstanding balance per customer |
| **Products** | CRUD, stock tracking, low-stock alerts, manual stock adjustments, adjustment history |
| **Sales**    | Multi-item sale creation, auto-inventory reduction, promise/collateral notes, repayment dates |
| **Payments** | Record payments against any sale, auto-update due balance, payment history |
| **Dues**     | Overdue indicator, promise note visibility, quick pay action |
| **Reports**  | Sales, payments, dues, inventory, customer reports — with date presets and CSV export |
| **Users**    | Add staff/admin, toggle role, deactivate users (admin only) |
| **Settings** | Business name, phone, address, invoice prefix, currency, low-stock threshold |

### Business Logic

- Sale total = sum of line items − item discounts − order discount
- Due amount = total − paid (auto-calculated)
- Payment status: `PAID` / `PARTIAL` / `UNPAID` / `OVERDUE` (auto-updated on each payment)
- Inventory reduces automatically when a sale is created; restores on sale delete
- First registered user becomes Admin; subsequent registrations become Staff
- Customers/products with history are soft-deleted (deactivated) rather than hard-deleted

### Nepal-specific

- Currency displayed in NPR (Rs.)
- Local payment methods: Cash, Bank Transfer, eSewa, Khalti, Fonepay, Cheque
- Phone number fields sized for Nepali formats (98XXXXXXXX)
- Address fields suit Nepal geography (city/district)
- Invoice prefix configurable (e.g. `INV`, `BILL`, `RCP`)

---

## Project Structure

```
nepal-crm/
├── app/
│   ├── (auth)           login, register pages
│   ├── dashboard/       main dashboard
│   ├── customers/       list, detail, new, edit
│   ├── products/        list, detail, new, edit
│   ├── sales/           list, detail, new
│   ├── payments/        payment list
│   ├── dues/            outstanding dues view
│   ├── reports/         all reports + CSV export
│   ├── users/           user management
│   ├── settings/        business settings
│   └── api/             all REST API routes
├── components/
│   ├── layout/          Sidebar, Navbar
│   ├── ui/              Button, Input, Modal, Badge, etc.
│   ├── dashboard/       StatsCard, DashboardChart
│   ├── customers/       CustomerForm
│   └── products/        ProductForm
├── lib/
│   ├── prisma.ts        Prisma client singleton
│   ├── auth.ts          NextAuth configuration
│   ├── utils.ts         formatCurrency, formatDate, etc.
│   └── validations/     Zod schemas for all entities
├── prisma/
│   ├── schema.prisma    Full database schema
│   └── seed.ts          Demo data seeder
└── types/               TypeScript types + NextAuth extension
```

---

## Database Schema

```
User           — id, name, email, password (bcrypt), role (ADMIN|STAFF), isActive
Customer       — id, name, phone, email, address, city, businessName, customerType, panVat
Product        — id, name, sku, category, costPrice, sellingPrice, stock, reorderLevel, unit
Sale           — id, invoiceNumber, customerId, saleDate, subtotal, discount, total, paid, due, status, promiseNote, nextRepayDate
SaleItem       — id, saleId, productId, productName (snapshot), quantity, unitPrice, discount, total
Payment        — id, saleId, customerId, paymentDate, amount, paymentMethod, referenceNote, receivedById
InventoryAdjustment — id, productId, type (INITIAL|MANUAL_IN|MANUAL_OUT|SALE|RETURN), quantity, reason, adjustedBy
BusinessSetting — id, businessName, phone, email, address, currency, invoicePrefix, lowStockDefault
```

---

## Production Deployment

### Switch to PostgreSQL

1. Edit `.env`:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/nepal_crm"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Run migration:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### Deploy to Vercel

```bash
vercel deploy
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — a strong random secret
- `NEXTAUTH_URL` — your production URL

---

## Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Sync schema (dev/SQLite)
npm run db:migrate   # Run migrations (production/PostgreSQL)
npm run db:seed      # Insert demo data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset and reseed (dev only)
```

---

## What's in MVP vs Future

### ✅ MVP Complete

- Full authentication with roles
- Customer CRUD with history and balance view
- Product CRUD with stock management and adjustments
- Sale entry with multiple line items, discounts, auto-inventory
- Payment tracking with history and auto due-calculation
- Dues view with overdue detection and promise notes
- Dashboard with 8 stat cards and interactive charts
- Reports (5 types) with date filters and CSV export
- User management for Admin
- Business settings

### 🔮 Future Versions

- Nepali calendar (Bikram Sambat) support
- Print/PDF invoice generation
- SMS notifications for due reminders
- Stock purchase orders / supplier management
- Multi-branch support
- Nepali language (i18n)
- Activity audit log
- Mobile app (React Native)
- Accounting integration / VAT reporting
- Customer statement PDF
- Barcode/QR scanning for product lookup

---

Built with care for Nepali businesses.
