import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { create, getOne, list, remove, update } from '../controllers/customerController.js';

const router = Router();
router.use(protect);

const id = param('id').isMongoId().withMessage('Invalid id');
const rules = [
  body('name').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 100 }),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('Phone is too long'),
  body('address').optional({ nullable: true }).trim().isLength({ max: 300 }).withMessage('Address is too long'),
];

router.route('/').get(list).post(rules, validate, create);
router
  .route('/:id')
  .get([id], validate, getOne)
  .put([id, ...rules], validate, update)
  .delete([id], validate, remove);

export default router;
