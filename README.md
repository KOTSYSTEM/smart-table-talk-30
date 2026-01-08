# KOTPro - Enterprise Restaurant Management System

An enterprise-grade, multi-tenant restaurant management and POS system built with React, TypeScript, and Supabase.

## Features

### Core Modules
- **Point of Sale (POS)** - Fast order processing with touch-friendly interface
- **Kitchen Display System (KDS)** - Real-time order tracking for kitchen staff
- **Table Management** - Visual floor plan with table status tracking
- **Menu Management** - Categories, items, variants, and modifiers
- **Order Management** - Order lifecycle from creation to completion
- **Reservations** - Table booking with waitlist support

### Enterprise Features
- **Multi-Tenant Architecture** - Complete organization isolation
- **Multi-Location Support** - Manage multiple restaurant branches
- **Role-Based Access Control (RBAC)** - Granular permissions per role
- **Staff Management** - Scheduling, time tracking, performance metrics
- **Inventory Management** - Stock tracking, suppliers, purchase orders
- **Customer Loyalty** - Points, tiers, and rewards program
- **Audit Logging** - Complete activity trail

### Coming Soon
- Customer-facing ordering app
- Delivery partner integrations
- Advanced analytics dashboard
- Mobile apps for staff and customers

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/KOTSYSTEM/smart-table-talk-30.git
cd smart-table-talk-30
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

5. Run database migrations (in Supabase SQL Editor):
   - `migrations/001_multi_tenant_upgrade.sql`
   - `migrations/002_user_management_security.sql`
   - `migrations/003_enhanced_data_model.sql`

6. Start the development server
```bash
npm run dev
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations
├── pages/          # Page components
├── types/          # TypeScript type definitions
└── utils/          # Utility functions

migrations/         # SQL migration files
```

## Database Schema

### Core Tables
- `organizations` - Tenant isolation
- `locations` - Multi-location support
- `staff` - Staff members with roles
- `categories` - Menu categories
- `menu_items` - Menu items
- `orders` - Customer orders
- `customers` - Customer records
- `reservations` - Table reservations

### Advanced Tables
- `permissions` - Granular permission definitions
- `role_templates` - Pre-configured role permissions
- `staff_schedules` - Staff scheduling
- `time_entries` - Clock in/out tracking
- `audit_logs` - Activity logging
- `inventory_items` - Stock management
- `suppliers` - Vendor management
- `recipes` - Recipe with ingredients
- `loyalty_rules` - Loyalty program config
- `loyalty_transactions` - Points history

## License

MIT License - See LICENSE file for details.

## Support

For support, email support@kotsystem.com or open an issue.
