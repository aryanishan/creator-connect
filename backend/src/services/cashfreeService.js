import crypto from 'crypto';

const getCashfreeBaseUrl = () => {
  const env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
  return env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
};

const getApiHeaders = () => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('Missing Cashfree credentials. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY');
  }

  return {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': appId,
    'x-client-secret': secretKey
  };
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};

export const createCashfreeOrder = async (payload) => {
  try {
    const response = await fetch(`${getCashfreeBaseUrl()}/orders`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      console.error('Cashfree API error response:', { status: response.status, data });
      const message = data.message || data.error_description || 'Cashfree create order failed';
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error('createCashfreeOrder error:', error);
    throw error;
  }
};

export const fetchCashfreeOrder = async (orderId) => {
  const response = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
    method: 'GET',
    headers: getApiHeaders()
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message = data.message || data.error_description || 'Cashfree fetch order failed';
    throw new Error(message);
  }

  return data;
};

export const verifyCashfreeWebhookSignature = ({ rawBody = '', signature = '', timestamp = '' }) => {
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!secretKey) return false;
  if (!signature || !timestamp) return false;

  const toleranceSec = Number(process.env.CASHFREE_WEBHOOK_TOLERANCE_SEC || 300);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSec) return false;

  const signedPayload = `${timestamp}${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(signedPayload)
    .digest('base64');

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};
