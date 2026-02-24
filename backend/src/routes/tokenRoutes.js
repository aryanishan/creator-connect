import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createTokenOrder,
  getMyTokenBalance,
  getTokenPlans,
  verifyTokenOrder
} from '../controllers/tokenController.js';

const router = express.Router();

router.get('/plans', protect, getTokenPlans);
router.get('/balance', protect, getMyTokenBalance);
router.post('/orders', protect, createTokenOrder);
router.get('/orders/:orderId/verify', protect, verifyTokenOrder);

export default router;

