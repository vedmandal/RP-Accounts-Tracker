import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { recent, summary } from '../controllers/dashboardController.js';

const router = Router();
router.use(protect);
router.get('/summary', summary);
router.get('/recent-transactions', recent);

export default router;
