import User from '../models/User.js';
import TokenPurchase from '../models/TokenPurchase.js';

export const mapCashfreeOrderStatus = (orderStatus = '') => {
  if (orderStatus === 'PAID') return 'PAID';
  if (orderStatus === 'ACTIVE') return 'PENDING';
  if (orderStatus === 'EXPIRED' || orderStatus === 'TERMINATED') return 'FAILED';
  return 'PENDING';
};

export const updatePurchasePaymentState = async ({
  purchase,
  status,
  paymentStatus = '',
  cfPaymentId = ''
}) => {
  const updates = {
    status,
    paymentStatus: paymentStatus || purchase.paymentStatus
  };

  if (cfPaymentId) updates.cfPaymentId = cfPaymentId;

  await TokenPurchase.updateOne({ _id: purchase._id }, { $set: updates });
};

export const creditTokensIfNeeded = async ({ purchaseId, cfPaymentId = '', paymentStatus = 'SUCCESS' }) => {
  const now = new Date();

  const claimResult = await TokenPurchase.updateOne(
    { _id: purchaseId, creditedAt: null },
    {
      $set: {
        status: 'PAID',
        paymentStatus,
        creditedAt: now,
        ...(cfPaymentId ? { cfPaymentId } : {})
      }
    }
  );

  if (claimResult.modifiedCount === 0) {
    const existing = await TokenPurchase.findById(purchaseId);
    return { alreadyCredited: true, purchase: existing };
  }

  const updatedPurchase = await TokenPurchase.findById(purchaseId);
  if (!updatedPurchase) {
    throw new Error('Purchase not found after payment update');
  }

  await User.updateOne(
    { _id: updatedPurchase.user },
    { $inc: { tokens: updatedPurchase.totalTokens } }
  );

  return { alreadyCredited: false, purchase: updatedPurchase };
};

