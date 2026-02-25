import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import './BuyTokens.css';

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

const loadCashfreeSdk = () =>
  new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree);
      return;
    }

    const existing = document.querySelector(`script[src="${CASHFREE_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.src = CASHFREE_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });

const BuyTokens = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, fetchUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingPlanId, setBuyingPlanId] = useState(null);
  const [error, setError] = useState(null);
  const [gatewayNote, setGatewayNote] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    // Check if returning from Cashfree payment
    const orderId = searchParams.get('order_id');
    if (orderId) {
      verifyPayment(orderId);
    } else {
      fetchPlans();
    }
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      setGatewayNote('');
      setSuccessMessage('');
      const response = await API.get('/tokens/plans');
      setPlans(response.data.plans);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load token plans. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (orderId) => {
    try {
      setVerifyingPayment(true);
      setError(null);
      setSuccessMessage('');

      const response = await API.get(`/tokens/orders/${orderId}/verify`);

      if (response.data.status === 'PAID') {
        await fetchUser();
        const creditedTokens = response.data.creditedTokens || 0;
        setSuccessMessage(`Payment successful! You received ${creditedTokens} tokens.`);
        window.history.replaceState({}, '', '/tokens/buy');
        fetchPlans();
      } else if (response.data.status === 'PENDING') {
        setError('Payment is still being processed. Please wait a moment and refresh.');
        setTimeout(() => verifyPayment(orderId), 3000);
      } else {
        setError('Payment failed. Please try again.');
        setTimeout(() => fetchPlans(), 2000);
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError('Failed to verify payment. Please contact support if the issue persists.');
      setTimeout(() => fetchPlans(), 2000);
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleBuyTokens = async (planId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setBuyingPlanId(planId);
      setError(null);
      setGatewayNote('');
      setSuccessMessage('');

      const customerPhone = user.phone || '9999999999';

      console.log('Sending token order request with planId:', planId);

      const response = await API.post('/tokens/orders', {
        planId,
        customerPhone
      });

      console.log('Token order response:', response.data);

      const { paymentSessionId, paymentLink, cashfreeEnv } = response.data;
      const mode = (cashfreeEnv || process.env.REACT_APP_CASHFREE_ENV || 'sandbox').toLowerCase();

      if (mode === 'sandbox') {
        setGatewayNote('Sandbox mode: use testsuccess@gocash (success) or testfailure@gocash (failure).');
      }

      if (!paymentSessionId && !paymentLink) {
        throw new Error('No payment session received from server');
      }

      // Prefer official SDK checkout for payment_session_id.
      if (paymentSessionId) {
        const Cashfree = await loadCashfreeSdk();
        if (!Cashfree) {
          throw new Error('Cashfree SDK unavailable');
        }

        const cashfree = Cashfree({ mode: mode === 'production' ? 'production' : 'sandbox' });

        console.log('Opening Cashfree SDK checkout with session:', paymentSessionId);
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_self'
        });
        return;
      }

      // Fallback only if backend returns a direct payment link.
      window.location.href = paymentLink;
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment');
      setBuyingPlanId(null);
    }
  };

  if (verifyingPayment) {
    return (
      <div className="buy-tokens-page fade-in">
        <div className="buy-tokens-card">
          <p>Verifying your payment...</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="buy-tokens-page fade-in">
        <div className="buy-tokens-card">
          <p>Loading token plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="buy-tokens-page fade-in">
      <div className="buy-tokens-card">
        <h1>Buy Tokens</h1>
        <p>Choose a token package that works for you.</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {gatewayNote && <p className="gateway-note">{gatewayNote}</p>}

        {plans.length === 0 ? (
          <p>No token plans available. Please try again later.</p>
        ) : (
          <div className="offer-grid">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`offer-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <h2>{plan.tokens} Tokens</h2>
                <p className="offer-price">Rs. {plan.amount}</p>
                {plan.bonusTokens > 0 ? (
                  <p className="offer-bonus">+ {plan.bonusTokens} Bonus Tokens</p>
                ) : (
                  <p className="offer-bonus empty">No bonus tokens</p>
                )}
                <button
                  type="button"
                  className="buy-btn"
                  onClick={() => handleBuyTokens(plan.id)}
                  disabled={buyingPlanId !== null}
                >
                  {buyingPlanId === plan.id ? 'Processing...' : 'Buy Now'}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyTokens;
