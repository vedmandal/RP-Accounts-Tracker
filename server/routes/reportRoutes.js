import { Router } from 'express';
import { query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { custom, daily, monthly, yearly } from '../controllers/reportController.js';
import { PAYMENT_METHODS } from '../config/constants.js';
import { isValidDateKey } from '../utils/dates.js';

const router = Router();
router.use(protect);

const filters = [
  query('type').optional({ checkFalsy: true }).isIn(['income', 'expense']).withMessage('Invalid type'),
  query('paymentMethod').optional({ checkFalsy: true }).isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  query('expenseType').optional({ checkFalsy: true }).isIn(['shop', 'home']).withMessage('Invalid expense type'),
];
const year = query('year').isInt({ min: 1900, max: 2200 }).withMessage('Valid year required');
const month = query('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required');
const dateOf = (name) => query(name).custom((v) => isValidDateKey(v)).withMessage(`Valid ${name} required (YYYY-MM-DD)`);

router.get('/daily', [dateOf('date'), ...filters], validate, daily);
router.get('/monthly', [year, month, ...filters], validate, monthly);
router.get('/yearly', [year, ...filters], validate, yearly);
router.get(
  '/custom',
  [
    dateOf('startDate'),
    dateOf('endDate'),
    query('endDate').custom((v, { req }) => v >= req.query.startDate).withMessage('End date must be on or after start date'),
    ...filters,
  ],
  validate,
  custom
);

export default router;
