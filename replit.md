# FinCalc - Construction Linked Home Loan EMI Calculator

## Overview

FinCalc is a web application for calculating EMI (Equated Monthly Installment) for construction-linked home loans where the bank disburses the loan in multiple stages. The core calculation engine runs client-side, computing how EMI changes after each disbursal based on the outstanding principal and remaining tenure. Users can also save their calculations to a PostgreSQL database for later reference.

The app handles:
- Multiple disbursal schedules with EMI recalculation at each stage
- Interest rate changes over the loan period
- Extra/prepayments
- Amortization schedule generation with charts and tables
- Saving/loading calculation configurations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter (lightweight client-side router) with two pages: Home (`/`) and Saved Calculations (`/saved`)
- **State Management**: TanStack React Query for server state (fetching/caching saved calculations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for visualizing loan amortization and EMI timelines
- **Date Handling**: date-fns for complex date calculations
- **Fonts**: Plus Jakarta Sans (body) and Outfit (display), loaded via CSS variables `--font-sans` and `--font-display`
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

Key components:
- `LoanInputs.tsx` - Form for entering loan details, disbursal schedule, rate changes, extra payments
- `LoanResults.tsx` - Displays calculation results with summary cards, charts, and amortization tables
- `calculator.ts` - Pure client-side EMI calculation engine (the core business logic)

### Backend (server/)
- **Framework**: Express 5 on Node.js with TypeScript
- **Runtime**: tsx for development, esbuild for production bundling
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Route Definitions**: Shared route definitions in `shared/routes.ts` with Zod schemas for input validation and response typing

API Endpoints:
- `GET /api/calculations` - List all saved calculations
- `POST /api/calculations` - Save a new calculation
- `GET /api/calculations/:id` - Get a specific calculation
- `DELETE /api/calculations/:id` - Delete a calculation

### Shared Code (shared/)
- `schema.ts` - Drizzle ORM table definitions and Zod insert schemas
- `routes.ts` - API route contracts (paths, methods, input/output schemas) used by both client and server

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema Push**: `npm run db:push` uses drizzle-kit to push schema changes
- **Migrations**: Output to `./migrations` directory
- **Session Store**: connect-pg-simple available for session management

Single table `calculations` with columns:
- `id` (serial, primary key)
- `name` (text) - user-friendly label
- `totalLoanAmount`, `loanTenureYears`, `interestRate` (numeric)
- `startDate` (timestamp)
- `disbursals` (jsonb) - array of `{date, amount}` objects
- `interestRateChanges` (jsonb) - array of `{date, rate}` objects
- `extraPayments` (jsonb) - array of `{date, amount}` objects
- `createdAt` (timestamp, auto-set)

### Build & Dev
- **Dev**: `npm run dev` - runs tsx with Vite dev server middleware (HMR enabled)
- **Build**: `npm run build` - Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` - serves pre-built assets from `dist/public`
- **Type Check**: `npm run check`

### Storage Pattern
- `IStorage` interface in `server/storage.ts` defines the data access contract
- `DatabaseStorage` class implements it with Drizzle ORM queries
- Exported as singleton `storage` instance

## External Dependencies

### Database
- **PostgreSQL** - Required, connection string via `DATABASE_URL` environment variable
- **Drizzle ORM** - Schema definition, query building, and migrations
- **drizzle-kit** - Schema push and migration generation

### Key Frontend Libraries
- **@tanstack/react-query** - Server state management and caching
- **recharts** - Charting library for loan visualization
- **date-fns** - Date arithmetic for tenure calculations
- **wouter** - Client-side routing
- **shadcn/ui + Radix UI** - Complete UI component library
- **Tailwind CSS** - Utility-first styling with CSS variables for theming
- **zod** - Runtime validation (shared between client and server)
- **react-hook-form + @hookform/resolvers** - Form handling

### Key Backend Libraries
- **express v5** - HTTP server framework
- **pg** (node-postgres) - PostgreSQL client driver
- **connect-pg-simple** - PostgreSQL session store
- **nanoid** - ID generation for Vite cache busting

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` - Runtime error overlay
- `@replit/vite-plugin-cartographer` - Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` - Dev banner (dev only)