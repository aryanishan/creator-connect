import express from 'express';
import { cashfreePaymentWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/payment', cashfreePaymentWebhook);
router.post('/payment/cashfree', cashfreePaymentWebhook);

export default router;
