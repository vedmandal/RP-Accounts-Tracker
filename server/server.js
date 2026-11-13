import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './config/db.js';
import seedCategories from './config/seed.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import creditRoutes from './routes/creditRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in server/.env`);
    process.exit(1);
  }
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (!isProd) app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'RP Enterprises API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/credit', creditRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/categories', categoryRoutes);

// Optional single-server deployment: serve the built React app (client/dist) from Express.
const clientDist = path.resolve(__dirname, '../client/dist');
if (isProd && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedCategories();
  app.listen(PORT, () => console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
