import TokenPurchase from '../models/TokenPurchase.js';
import { creditTokensIfNeeded, updatePurchasePaymentState } from './tokenPurchaseService.js';

export const extractCashfreeWebhook = (payload = {}) => {
  const eventType = payload.type || payload.event || 'unknown';
  const orderId = payload?.data?.order?.order_id || '';
  const paymentStatus = payload?.data?.payment?.payment_status || '';
  const cfPaymentId = payload?.data?.payment?.cf_payment_id || '';

  return {
    eventType,
    orderId,
    paymentStatus,
    cfPaymentId,
    payload
  };
};

export const processCashfreeWebhook = async (payload) => {
  const event = extractCashfreeWebhook(payload);
  if (!event.orderId) {
    return { ignored: true, reason: 'Missing order_id' };
  }

  const purchase = await TokenPurchase.findOne({ orderId: event.orderId });
  if (!purchase) {
    return { ignored: true, reason: 'Order not found' };
  }

  if (event.paymentStatus === 'SUCCESS') {
    const creditResult = await creditTokensIfNeeded({
      purchaseId: purchase._id,
      cfPaymentId: event.cfPaymentId,
      paymentStatus: event.paymentStatus
    });

    return {
      ignored: false,
      status: 'PAID',
      alreadyCredited: creditResult.alreadyCredited
    };
  }

  const nextStatus = event.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING';
  await updatePurchasePaymentState({
    purchase,
    status: nextStatus,
    paymentStatus: event.paymentStatus || purchase.paymentStatus,
    cfPaymentId: event.cfPaymentId
  });

  return {
    ignored: false,
    status: nextStatus,
    alreadyCredited: true
  };
};

