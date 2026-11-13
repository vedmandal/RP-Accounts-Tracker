import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { create, list, remove, update } from '../controllers/categoryController.js';

const router = Router();
router.use(protect);

const id = param('id').isMongoId().withMessage('Invalid id');

router.get('/', list);
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 60 }),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('expenseType').if(body('type').equals('expense')).isIn(['shop', 'home']).withMessage('Expense type must be shop or home'),
  ],
  validate,
  create
);
router.put(
  '/:id',
  [id, body('name').optional().trim().notEmpty().isLength({ max: 60 }), body('expenseType').optional().isIn(['shop', 'home'])],
  validate,
  update
);
router.delete('/:id', [id], validate, remove);

export default router;
