# FinCalc - Construction Linked Home Loan EMI Calculator

FinCalc is a professional-grade financial planning tool designed to calculate Equated Monthly Installments (EMI) for construction-linked home loans. Unlike standard calculators, FinCalc accounts for multi-stage disbursals, variable interest rates, and extra principal repayments, providing a precise roadmap for loan closure.

## 🚀 Key Features

- **Construction-Linked Disbursals**: Dynamically recalculates EMI after every disbursal phase based on the outstanding principal and remaining tenure.
- **Variable Interest Rates**: Supports multiple interest rate changes throughout the loan tenure, adjusting the EMI and amortization schedule automatically.
- **Systemic Extra Payments**: Option to pay a "Full EMI" from day one, even during the construction phase, to significantly reduce principal and tenure.
- **Manual Principal Prepayments**: Ability to add ad-hoc extra payments on specific dates to see their impact on interest savings.
- **Professional Reports**: Generates a multi-page printable PDF report including:
  - Loan configuration summary
  - Disbursal & Interest rate history
  - Phase-wise EMI timeline
  - Full month-by-month amortization schedule
- **Interactive Visualizations**: Real-time charts showing principal reduction and EMI progression using Recharts.

## 🛠 Technology Stack

### Frontend
- **React 18**: Modern UI library for a reactive user experience.
- **TypeScript**: Ensures type safety across the calculation engine.
- **Vite**: Ultra-fast build tool and development server.
- **Shadcn UI & Tailwind CSS**: For a clean, professional, and responsive design.
- **Recharts**: High-performance charting for financial data.
- **date-fns**: Precise date arithmetic for tenure and schedule generation.
- **TanStack Query**: Efficient state management for saved calculations.

### Backend
- **Node.js & Express**: Lightweight API server.
- **PostgreSQL**: Reliable storage for your saved calculation scenarios.
- **Drizzle ORM**: Type-safe database interactions and schema management.
- **Zod**: Runtime validation for API contracts and form data.

## 📂 Codebase Walkthrough

### 1. Calculation Engine (`client/src/lib/calculator.ts`)
The "brain" of the application. It iterates month-by-month, checking for three types of events:
- **Disbursals**: Increases principal and triggers EMI recalculation.
- **Rate Changes**: Adjusts the monthly interest component and recalculates EMI.
- **Extra Payments**: Directly reduces principal, shortening the loan term.

### 2. Shared Schema (`shared/schema.ts` & `shared/routes.ts`)
Defines the "source of truth" for data. The `calculations` table stores the complex JSON objects for disbursals and rate changes, ensuring consistency between the UI and the database.

### 3. UI Components (`client/src/components/`)
- `LoanInputs.tsx`: A robust form handling dynamic lists of disbursals and rate changes with manual date entry support.
- `LoanResults.tsx`: Manages the display of summary cards, charts, and the printable report layout.

### 4. API Layer (`server/routes.ts`)
Simple RESTful endpoints for CRUD operations on saved calculations, utilizing the `storage.ts` abstraction layer.

## 🚢 CI/CD & Deployment

This project is optimized for the Replit platform, which provides seamless CI/CD:

1. **Automated Provisioning**: The `replit.nix` and `package.json` files ensure all dependencies (Node.js, PostgreSQL) are configured automatically.
2. **Database Migrations**: Uses `drizzle-kit push` to keep the database schema in sync without manual SQL scripts.
3. **Deployment**:
   - **Development**: Run `npm run dev` for hot-module replacement (HMR).
   - **Production**: Click the **Deploy** button on Replit. It automatically builds the frontend (`dist/public`), bundles the server, and hosts the application on a `.replit.app` domain with managed SSL.

To run this project locally:
```bash
npm install
npm run db:push
npm run dev
```

Ensure a `DATABASE_URL` environment variable is pointing to a PostgreSQL instance.
