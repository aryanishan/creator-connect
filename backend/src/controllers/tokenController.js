import { getTokenPlanById, getTokenPlanList } from '../config/tokenPlans.js';
import TokenPurchase from '../models/TokenPurchase.js';
import { createCashfreeOrder, fetchCashfreeOrder } from '../services/cashfreeService.js';
import {
  creditTokensIfNeeded,
  mapCashfreeOrderStatus,
  updatePurchasePaymentState
} from '../services/tokenPurchaseService.js';

const buildOrderId = (userId) => {
  const suffix = userId.toString().slice(-6);
  return `tok_${suffix}_${Date.now()}`;
};

const buildReturnUrl = () => {
  if (process.env.TOKEN_BUY_RETURN_URL) return process.env.TOKEN_BUY_RETURN_URL;
  const clientUrl = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:3000';
  return `${clientUrl}/tokens/buy`;
};

const getCashfreeCheckoutBaseUrl = () => {
  return (process.env.CASHFREE_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://payments.cashfree.com'
    : 'https://sandbox.cashfree.com';
};

const isAutoSuccessEnabled = () => process.env.CASHFREE_AUTO_SUCCESS === 'true';

export const getTokenPlans = async (req, res) => {
  return res.json({ plans: getTokenPlanList() });
};

export const createTokenOrder = async (req, res) => {
  try {
    const { planId, customerPhone } = req.body;
    const plan = getTokenPlanById(planId);

    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const orderId = buildOrderId(req.user._id);
    const totalTokens = plan.tokens + plan.bonusTokens;

    const purchase = await TokenPurchase.create({
      user: req.user._id,
      planId: plan.id,
      orderId,
      amount: plan.amount,
      currency: plan.currency,
      tokens: plan.tokens,
      bonusTokens: plan.bonusTokens,
      totalTokens,
      status: 'CREATED'
    });

    if (isAutoSuccessEnabled()) {
      const creditResult = await creditTokensIfNeeded({
        purchaseId: purchase._id,
        cfPaymentId: `mock_${Date.now()}`,
        paymentStatus: 'SUCCESS'
      });

      return res.status(201).json({
        orderId,
        status: 'PAID',
        autoVerified: true,
        alreadyCredited: creditResult.alreadyCredited,
        creditedTokens: totalTokens,
        plan: {
          id: plan.id,
          amount: plan.amount,
          tokens: plan.tokens,
          bonusTokens: plan.bonusTokens,
          totalTokens
        }
      });
    }

    const safePhone = (customerPhone || '9876543210').replace(/\D/g, '').slice(-10);
    const orderAmount = Number(plan.amount.toFixed(2));

    const cashfreePayload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: plan.currency,
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_email: req.user.email,
        customer_phone: safePhone
      },
      order_meta: {
        return_url: `${buildReturnUrl()}?order_id={order_id}`
      }
    };

    console.log('Creating Cashfree order with payload:', cashfreePayload);

    const cfOrder = await createCashfreeOrder(cashfreePayload);

    console.log('Cashfree order response:', cfOrder);

    const paymentSessionId = cfOrder.payment_session_id || '';
    const paymentLink =
      cfOrder.payment_link || (paymentSessionId ? `${getCashfreeCheckoutBaseUrl()}/pg/pay/${paymentSessionId}` : '');

    await TokenPurchase.updateOne(
      { _id: purchase._id },
      {
        $set: {
          cfOrderId: cfOrder.cf_order_id || '',
          status: 'PENDING',
          meta: { paymentSessionId, paymentLink }
        }
      }
    );

    return res.status(201).json({
      orderId,
      cfOrderId: cfOrder.cf_order_id,
      paymentSessionId,
      paymentLink,
      plan: {
        id: plan.id,
        amount: plan.amount,
        tokens: plan.tokens,
        bonusTokens: plan.bonusTokens,
        totalTokens
      }
    });
  } catch (error) {
    console.error('createTokenOrder error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create token order' });
  }
};

export const verifyTokenOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const purchase = await TokenPurchase.findOne({ orderId, user: req.user._id });
    if (!purchase) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (purchase.status === 'PAID' || purchase.creditedAt) {
      return res.json({
        orderId,
        status: 'PAID',
        alreadyCredited: true,
        creditedTokens: purchase.totalTokens
      });
    }

    const cfOrder = await fetchCashfreeOrder(orderId);
    const mappedStatus = mapCashfreeOrderStatus(cfOrder.order_status);

    if (mappedStatus === 'PAID') {
      const paymentStatus = cfOrder.payment_status || 'SUCCESS';
      const cfPaymentId = cfOrder.cf_payment_id || '';
      const creditResult = await creditTokensIfNeeded({
        purchaseId: purchase._id,
        cfPaymentId,
        paymentStatus
      });

      return res.json({
        orderId,
        status: 'PAID',
        alreadyCredited: creditResult.alreadyCredited,
        creditedTokens: purchase.totalTokens
      });
    }

    await updatePurchasePaymentState({
      purchase,
      status: mappedStatus,
      paymentStatus: cfOrder.payment_status || purchase.paymentStatus
    });

    return res.json({
      orderId,
      status: mappedStatus
    });
  } catch (error) {
    console.error('verifyTokenOrder error:', error);
    return res.status(500).json({ message: error.message || 'Failed to verify token order' });
  }
};

export const getMyTokenBalance = async (req, res) => {
  return res.json({
    tokens: req.user.tokens || 0
  });
};
