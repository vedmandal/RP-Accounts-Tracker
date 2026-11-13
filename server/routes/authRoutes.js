import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { login, me, register, setupStatus } from '../controllers/authController.js';
import { protect, registerGuard } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts, try again later' } });

router.get('/setup-status', setupStatus);

router.post(
  '/register',
  registerGuard,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Invalid role'),
  ],
  validate,
  register
);

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);

router.get('/me', protect, me);

export default router;
