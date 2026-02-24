import { verifyCashfreeWebhookSignature } from '../services/cashfreeService.js';
import { processCashfreeWebhook } from '../services/webhookService.js';

export const cashfreePaymentWebhook = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    if (!rawBody) {
      return res.status(400).json({ message: 'Invalid webhook body' });
    }

    const signature = req.header('x-webhook-signature') || '';
    const timestamp = req.header('x-webhook-timestamp') || '';

    const signatureOk = verifyCashfreeWebhookSignature({
      rawBody,
      signature,
      timestamp
    });

    if (!signatureOk) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const result = await processCashfreeWebhook(payload);

    return res.status(200).json({
      message: 'Webhook processed',
      result
    });
  } catch (error) {
    console.error('cashfreePaymentWebhook error:', error);
    return res.status(500).json({ message: 'Failed to process webhook' });
  }
};

