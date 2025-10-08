import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import apiService from '../services/api';

const PurchaseCredits = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const canceled = searchParams.get('canceled');

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 100,
      price: 99,
      priceFormatted: '₹99',
      description: 'Perfect for getting started with AI conversations',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      credits: 250,
      price: 249,
      priceFormatted: '₹249',
      description: 'Great value for regular AI interactions',
      popular: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate Pack',
      credits: 500,
      price: 499,
      priceFormatted: '₹499',
      description: 'Best value for heavy AI usage',
      popular: false
    }
  ];

  const handlePurchase = async (planId) => {
    setProcessingPlanId(planId);
    try {
      console.log('🛒 Starting purchase process...');
      
      const response = await apiService.request('/pay/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });

      console.log('🛒 Checkout response received');
      console.log('🛒 Redirecting to Stripe...');
      
      window.location.href = response.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-white hover:bg-gray-100 rounded-full shadow-md transition-all transform hover:scale-110"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-4xl font-bold text-gray-900 flex-1 text-center">
              Purchase Credits
            </h1>
            <div className="w-12"></div>
          </div>
          
          <p className="text-lg text-gray-600 text-center">
            Get more credits to continue your AI conversations
          </p>
          
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-600">Current Balance:</span>
              <span className="font-bold text-gray-900 text-lg">
                {user?.credits !== undefined ? user.credits.toLocaleString() : '0'} credits
              </span>
            </div>
          </div>
        </div>

        {canceled && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-yellow-800">
              Payment was canceled. You can try again whenever you're ready.
            </p>
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <div className="inline-flex bg-white border-2 border-blue-200 rounded-xl p-4 shadow-md">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">🧪 Test Card:</span>
                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded">4242 4242 4242 4242</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Expiry:</span>
                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded">12/25</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">CVC:</span>
                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded">123</span>
              </div>
              <div className="text-gray-500">
                💡 No real money charged
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                plan.popular 
                  ? 'border-2 border-blue-500' 
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold">
                  ⭐ Popular
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.priceFormatted}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">one-time payment</div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {plan.credits.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">credits</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>No expiration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Secure payment</span>
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={processingPlanId !== null}
                  className={`w-full font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {processingPlanId === plan.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Processing...</span>
                    </div>
                  ) : (
                    <span className="text-sm">Purchase Now</span>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secured by Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600 max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
          <p className="text-sm">
            Each message you send uses 1 credit. Purchase credits to keep chatting with our AI. 
            Your credits never expire and you can purchase more anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCredits;
