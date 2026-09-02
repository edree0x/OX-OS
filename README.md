# OX OS — Multi-Sector ERP Platform

> A browser-first, zero-backend ERP system that adapts to 14 business sectors through a guided setup wizard. All data lives in IndexedDB — no server, no database, no vendor lock-in.

---

## Features

- **14 Industry Presets** — Supermarket, Grocery, Pharmacy, Apparel, Restaurant, Hotel, Repair Shop, Salon, Barbershop, Gaming Lounge, Gym, Clinic, Education, and Custom.
- **3-Step Setup Wizard** — Choose sector → enter business details → start. Fully seeded with realistic demo data.
- **Runtime Field Customization** — Authorized users add, edit, reorder, and delete entity fields without touching code.
- **Role-Based Access Control** — Admin, Manager, Cashier, Staff with per-user permission grants (e.g. `manageFields`).
- **Point of Sale** — Thermal receipt layout (80mm), line items, modifiers, tender types, A4 and thermal PDF export.
- **Dashboard Widgets** — Stats, charts, lists, tables, alerts — fully configurable per sector.
- **Entity Management** — CRUD records, filtering, search, pagination, inline quick-add, status badges, entity references.
- **Additional Views** — Table Map (restaurants), Calendar Bookings, Kanban Tickets.
- **Reports** — Date-range filtered reports across all entity types.
- **Theme System** — Dark/Light mode, sector-specific accent colors via CSS custom properties.
- **Print-Ready Receipts** — Optimized `@media print` CSS for 80mm thermal paper with proper margins, font sizes, and page breaks.

---

## Supported Sectors

| Sector | Entities | POS | Table Map | Calendar | Kanban |
|--------|----------|:---:|:---------:|:--------:|:------:|
| Supermarket & Grocery | Products, Categories, Suppliers, Customers, Sales | ✓ | — | — | — |
| Grocery Store | Products, Categories, Suppliers, Customers, Sales | ✓ | — | — | — |
| Pharmacy | Medicines, Categories, Suppliers, Customers, Sales | ✓ | — | — | — |
| Apparel & Fashion | Products, Categories, Suppliers, Customers, Sales | ✓ | — | — | — |
| Restaurants & Cafes | Menu Items, Categories, Suppliers, Customers, Orders | ✓ | ✓ | — | — |
| Hotels & Hospitality | Rooms, Guests, Reservations, Staff, Invoices | ✓ | ✓ | ✓ | — |
| Repair & Maintenance | Devices, Parts, Technicians, Customers, Work Orders | — | — | — | ✓ |
| Salons & Spa | Services, Staff, Appointments, Customers, Invoices | ✓ | — | ✓ | — |
| Barbershop & Grooming | Services, Barbers, Appointments, Customers, Invoices | ✓ | — | ✓ | — |
| Gaming Lounge | Devices, Sessions, Customers, Invoices | ✓ | ✓ | — | — |
| Gyms & Fitness | Members, Trainers, Classes, Attendance, Invoices | — | — | ✓ | — |
| Clinics & Healthcare | Patients, Doctors, Appointments, Prescriptions, Invoices | — | — | ✓ | — |
| Education & Academies | Students, Instructors, Classes, Attendance, Grades | — | — | ✓ | — |
| Custom Application | Your own entity structure | — | — | — | — |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript 5.6 |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 (persisted) |
| Server State | TanStack Query 5 |
| Routing | React Router 6 |
| Forms | React Hook Form + Zod |
| PDF | jsPDF |
| Icons | Lucide React |
| Testing | Vitest |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Run

```bash
git clone <repo-url>
cd "OX OS"
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### First Launch

1. The **Setup Wizard** appears automatically.
2. **Step 1** — Choose a business sector (e.g. Supermarket & Grocery).
3. **Step 2** — Enter your app name, business name, and currency.
4. **Step 3** — Review and click **Finish & start**.

The app seeds demo data for your chosen sector and logs you in as `admin`.

### Default Users

| Username | Password | Role | Notes |
|----------|----------|------|-------|
| `admin` | `admin` | Admin | Full access, can manage users and fields |
| `manager` | `manager` | Manager | Can manage entity fields |
| `cashier` | `cashier` | Cashier | POS access, no field management |
| `staff` | `staff` | Staff | Read-only, no field management |

> Passwords default to the username if not specified during creation.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript type checking (no emit) |
| `npm test` | Run test suite with Vitest |

---

## Project Structure

```
src/
├── app/
│   └── router.tsx              # Route definitions, lazy loading
├── pages/
│   ├── DashboardPage.tsx       # Configurable widget dashboard
│   ├── EntityPage.tsx          # Generic entity CRUD view
│   ├── PosPage.tsx             # Point of Sale interface
│   ├── TableMapPage.tsx        # Restaurant table layout
│   ├── CalendarPage.tsx        # Booking/appointment calendar
│   ├── KanbanPage.tsx          # Ticket/work-order board
│   ├── ReportsPage.tsx         # Date-range filtered reports
│   ├── SettingsPage.tsx        # App configuration + field editor
│   ├── UsersPage.tsx           # RBAC user management
│   ├── SetupWizard.tsx         # First-run setup wizard
│   └── LoginPage.tsx           # Authentication
├── components/
│   ├── auth/RequireAuth.tsx    # Auth + role route guards
│   ├── forms/
│   │   ├── DynamicForm.tsx     # Auto-generated forms from FieldSchema
│   │   ├── FieldEditor.tsx     # Runtime entity field editor
│   │   └── FieldRenderer.tsx   # Individual field type renderers
│   ├── data/DataTable.tsx, FilterBar.tsx, Pagination.tsx, SearchBar.tsx
│   ├── layout/ Layout.tsx, Header.tsx, Sidebar.tsx
│   ├── pos/PosView.tsx         # POS + receipt component
│   ├── dashboard/Widget.tsx    # Dashboard widget renderer
│   └── ui/primitives.tsx       # Shared UI primitives (Modal, Button, etc.)
├── config/
│   └── presets.ts              # 14 sector presets (entities, views, widgets)
├── hooks/                      # Custom hooks (usePermissions, useAppConfig, etc.)
├── lib/
│   ├── field-editor.ts         # Field editor utilities + validation
│   ├── invoices.ts             # A4 PDF generation
│   └── utils.ts                # General utilities
├── modules/                    # Module registry (dynamic feature loading)
├── services/
│   ├── authService.ts          # Zustand auth store
│   ├── seedService.ts          # Per-sector demo data seeder
│   ├── userService.ts          # User CRUD + permission management
│   └── invoiceService.ts       # Invoice persistence (IndexedDB)
├── stores/
│   ├── configStore.ts          # App config persistence
│   └── themeStore.ts           # Theme (dark/light/accent)
└── types/
    └── index.ts                # All TypeScript interfaces
```

---

## Storage

Everything is stored **client-side**:

| Store | Backend | Purpose |
|-------|---------|---------|
| `multi-sector-erp` | IndexedDB | Records, users, invoices |
| `multi-sector-erp-auth` | localStorage | Auth session (Zustand persist) |
| `multi-sector-erp-config` | localStorage | App configuration |
| `seeded:<sector>:<app>` | localStorage | One-time seed flag per config |

No data leaves the browser. No backend required.

---

## Permissions

| Permission | Admin | Manager | Cashier | Staff |
|------------|:-----:|:-------:|:-------:|:-----:|
| Full access | ✓ | — | — | — |
| Manage entity fields (`manageFields`) | ✓ | ✓ | — | — |
| POS operations | ✓ | ✓ | ✓ | — |
| Read-only data access | ✓ | ✓ | ✓ | ✓ |

Additional permissions can be granted per-user via the Users page (admin only).

---

## Receipt & PDF

### Thermal Receipt (80mm)
- Optimized for standard 80mm thermal paper
- Configurable shop name, address, phone
- Line items with quantity, unit price, and line totals
- Subtotal, discount, tax, total
- Tender breakdown (cash/card/credit) and change
- `@media print` CSS handles page size, margins, and visibility isolation

### A4 Invoice
- Generated via jsPDF
- Full itemized table with tax breakdown
- Business and customer details
- Consistent totals logic shared with thermal receipt

---

## Runtime Field Customization

Authorized users (admin, manager, or anyone with the `manageFields` permission) can:

1. **Click "Customize fields"** on any entity page (top-right button)
2. **Add new fields** — type, label, and key are auto-generated
3. **Edit existing fields** — rename, change type, add options, mark required
4. **Reorder fields** — drag to rearrange
5. **Delete fields** — with data migration cleanup
6. **Protected keys** — core business fields (e.g. `name`, `price`) cannot be deleted

Entry points:
- Entity page header: **"Customize fields"** button
- Settings page: **"Edit fields"** button per entity
- Record forms: **"Add field"** button inline (for authorized users)

Field types: `text`, `number`, `email`, `date`, `datetime-local`, `time`, `select`, `checkbox`, `textarea`, `variants`, `status-badge`, `timer`, `file-upload`, `image-preview`.

---

## Built With

- [React](https://react.dev/) — UI library
- [Vite](https://vite.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [TanStack Query](https://tanstack.com/query) — Server state
- [React Router](https://reactrouter.com/) — Client routing
- [React Hook Form](https://react-hook-form.com/) — Form management
- [Zod](https://zod.dev/) — Schema validation
- [jsPDF](https://parall.ax/products/jspdf) — PDF generation
- [Lucide](https://lucide.dev/) — Icon library
=======
# OX-OS
>>>>>>> a09633f7cafd539f65502c0a3ef204056e71de90
