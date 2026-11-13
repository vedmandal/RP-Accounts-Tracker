import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { addPayment, createSale, customerCredit, listSales, removePayment, summary } from '../controllers/creditController.js';
import { PAYMENT_METHODS } from '../config/constants.js';
import { isValidDateKey } from '../utils/dates.js';

const router = Router();
router.use(protect);

router.get('/summary', summary);

router
  .route('/sales')
  .get(listSales)
  .post(
    [
      body('customer').isMongoId().withMessage('Select a customer'),
      body('totalAmount').isFloat({ gt: 0 }).withMessage('Total amount must be greater than 0'),
      body('paidAmount').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Paid amount cannot be negative'),
      body('paymentMethod')
        .if(body('paidAmount').isFloat({ gt: 0 }))
        .isIn(PAYMENT_METHODS)
        .withMessage('Payment method is required when an amount is paid'),
      body('saleDate').optional({ checkFalsy: true }).custom((v) => isValidDateKey(v)).withMessage('Invalid sale date'),
      body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
      body('idempotencyKey').optional({ nullable: true }).isString().isLength({ max: 100 }),
    ],
    validate,
    createSale
  );

router.post(
  '/payments',
  [
    body('creditSale').isMongoId().withMessage('Select a credit sale'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod').isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
    body('paymentDate').optional({ checkFalsy: true }).custom((v) => isValidDateKey(v)).withMessage('Invalid payment date'),
    body('note').optional({ nullable: true }).trim().isLength({ max: 300 }),
    body('idempotencyKey').optional({ nullable: true }).isString().isLength({ max: 100 }),
  ],
  validate,
  addPayment
);

router.delete('/payments/:id', [param('id').isMongoId().withMessage('Invalid id')], validate, removePayment);
router.get('/customers/:id', [param('id').isMongoId().withMessage('Invalid id')], validate, customerCredit);

export default router;
