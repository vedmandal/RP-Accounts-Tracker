import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { getBalances, history, setOpening, transfer } from '../controllers/balanceController.js';
import { ACCOUNTS } from '../config/constants.js';
import { isValidDateKey } from '../utils/dates.js';

const router = Router();
router.use(protect);

router.get('/', getBalances);
router.get('/history', history);

router.post(
  '/opening',
  [
    body('accountType').isIn(ACCOUNTS).withMessage('Invalid account'),
    body('openingBalance').isFloat().withMessage('Opening balance must be a number'),
    body('openingDate').optional({ checkFalsy: true }).custom((v) => isValidDateKey(v)).withMessage('Invalid date'),
  ],
  validate,
  setOpening
);

router.post(
  '/transfer',
  [
    body('fromAccount').isIn(ACCOUNTS).withMessage('Invalid source account'),
    body('toAccount').isIn(ACCOUNTS).withMessage('Invalid destination account'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('transferDate').optional({ checkFalsy: true }).custom((v) => isValidDateKey(v)).withMessage('Invalid date'),
    body('note').optional({ nullable: true }).trim().isLength({ max: 300 }),
    body('idempotencyKey').optional({ nullable: true }).isString().isLength({ max: 100 }),
  ],
  validate,
  transfer
);

export default router;
