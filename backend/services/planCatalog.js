const PLANS = {
  starter: { 
    planId: 'starter', 
    credits: 100, 
    amount: 9900, // paise
    lookup_key: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for getting started with AI conversations'
  },
  pro: { 
    planId: 'pro', 
    credits: 250, 
    amount: 24900, // paise
    lookup_key: 'pro',
    name: 'Pro Pack',
    description: 'Great value for regular AI interactions'
  },
  ultimate: { 
    planId: 'ultimate', 
    credits: 500, 
    amount: 49900, // paise
    lookup_key: 'ultimate',
    name: 'Ultimate Pack',
    description: 'Best value for heavy AI usage'
  }
};

module.exports = {
  plans: PLANS,
  get(planId) {
    return PLANS[planId];
  }
};

