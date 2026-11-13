import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { calendar, create, day, getOne, list, remove, update } from '../controllers/transactionController.js';
import { PAYMENT_METHODS } from '../config/constants.js';
import { isValidDateKey } from '../utils/dates.js';

const router = Router();
router.use(protect);

const dateCheck = (v) => isValidDateKey(v);

const txnRules = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('paymentMethod').isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('transactionDate').optional({ checkFalsy: true }).custom(dateCheck).withMessage('Invalid date (use YYYY-MM-DD)'),
  body('expenseName').if(body('type').equals('expense')).trim().notEmpty().withMessage('Expense name is required'),
  body('customerName').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Customer name is too long'),
  body('paidTo').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Paid To is too long'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description is too long'),
  body('idempotencyKey').optional({ nullable: true }).isString().isLength({ max: 100 }),
];

const listRules = [
  query('type').optional({ checkFalsy: true }).isIn(['income', 'expense']),
  query('paymentMethod').optional({ checkFalsy: true }).isIn(PAYMENT_METHODS),
  query('date').optional({ checkFalsy: true }).custom(dateCheck).withMessage('Invalid date'),
  query('startDate').optional({ checkFalsy: true }).custom(dateCheck).withMessage('Invalid start date'),
  query('endDate').optional({ checkFalsy: true }).custom(dateCheck).withMessage('Invalid end date'),
  query('month').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
  query('year').optional({ checkFalsy: true }).isInt({ min: 1900, max: 2200 }).withMessage('Invalid year'),
];

// Fixed paths must come before "/:id".
router.get(
  '/calendar',
  [query('year').isInt({ min: 1900, max: 2200 }).withMessage('Valid year required'), query('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required')],
  validate,
  calendar
);
router.get('/day/:dateKey', [param('dateKey').custom(dateCheck).withMessage('Invalid date')], validate, day);

router.route('/').get(listRules, validate, list).post(txnRules, validate, create);
router
  .route('/:id')
  .get([param('id').isMongoId().withMessage('Invalid id')], validate, getOne)
  .put([param('id').isMongoId().withMessage('Invalid id'), ...txnRules], validate, update)
  .delete([param('id').isMongoId().withMessage('Invalid id')], validate, remove);

export default router;
