# RP Enterprises – Shop Management & Financial Tracking

MERN app (React + Vite, Express, MongoDB Atlas) for daily income/expense records, calendar history,
customer credit, cash/UPI/bank balances and reports.

## Setup
1. `npm run install:all`
2. `cp server/.env.example server/.env` and set `MONGO_URI` (MongoDB Atlas) and `JWT_SECRET`
3. `npm run dev` → client http://localhost:5173, API http://localhost:5000
4. Open the app: the first visit shows "Create Admin Account". After that, only admins can add users (Settings).

Use MongoDB Atlas (or any replica set) so multi-document transactions work. On a standalone local MongoDB the
app still runs, but credit payments are not atomic.

## Production
`npm run build --prefix client`, then `NODE_ENV=production npm start --prefix server`
(Express serves `client/dist`). Or deploy the client separately and set `VITE_API_URL`.

## Design rules (financial correctness)
- Money is stored as integer paise; the API speaks rupees.
- Every transaction has `dateKey` ("YYYY-MM-DD", shop-local date). Calendar, daily, monthly, yearly queries use dateKey ranges.
- Balances are derived (opening + income − expense ± transfers), never edited directly, so edits/deletes stay consistent.
- Credit sales are not income. Each payment received (including the part paid at sale time) creates exactly one income
  transaction (category "Credit Collection"), managed from Credit Management.
- Transfers are a separate collection and never count as income/expense. "Other" payment method counts toward Bank.
- Write endpoints accept `idempotencyKey` so double clicks cannot create duplicates.

## API
auth: POST /api/auth/register|login, GET /api/auth/me, GET /api/auth/setup-status
transactions: CRUD at /api/transactions, GET /calendar?year&month, GET /day/:date
dashboard: GET /api/dashboard/summary, /recent-transactions
reports: GET /api/reports/daily|monthly|yearly|custom
customers: CRUD /api/customers
credit: POST|GET /api/credit/sales, POST /api/credit/payments, DELETE /api/credit/payments/:id, GET /api/credit/customers/:id, GET /api/credit/summary
balances: GET /api/balances, POST /opening, POST /transfer, GET /history
categories: CRUD /api/categories
