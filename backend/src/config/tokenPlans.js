export const TOKEN_PLANS = {
  starter_100: {
    id: 'starter_100',
    label: '100 Tokens',
    amount: 99,
    currency: 'INR',
    tokens: 100,
    bonusTokens: 0
  },
  popular_500: {
    id: 'popular_500',
    label: '500 Tokens + 100 Bonus',
    amount: 499,
    currency: 'INR',
    tokens: 500,
    bonusTokens: 100
  },
  pro_1200: {
    id: 'pro_1200',
    label: '1200 Tokens + 100 Bonus',
    amount: 999,
    currency: 'INR',
    tokens: 1200,
    bonusTokens: 100
  }
};

export const getTokenPlanById = (planId) => TOKEN_PLANS[planId] || null;

export const getTokenPlanList = () => Object.values(TOKEN_PLANS);

