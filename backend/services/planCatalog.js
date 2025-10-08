const PLANS = {
  credits_500: { 
    planId: 'credits_500', 
    credits: 500, 
    amount: 49900, 
    lookup_key: 'credits_500',
    name: 'Credits Pack',
    description: 'Get 500 credits to power your conversations'
  }
};

module.exports = {
  plans: PLANS,
  get(planId) {
    return PLANS[planId];
  }
};

