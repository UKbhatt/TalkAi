import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Check, Sparkles, Zap, Crown } from 'lucide-react';
import apiService from '../services/api';

const PurchaseCredits = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await apiService.request('/payment/plans');
      setPlans(response.plans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId) => {
    setProcessingPlan(planId);
    try {
      const response = await apiService.request('/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });

      window.location.href = response.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setProcessingPlan(null);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'starter':
        return <Sparkles className="w-12 h-12 text-blue-600" />;
      case 'pro':
        return <Zap className="w-12 h-12 text-purple-600" />;
      case 'ultimate':
        return <Crown className="w-12 h-12 text-yellow-600" />;
      default:
        return <CreditCard className="w-12 h-12 text-gray-600" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'starter':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'pro':
        return 'from-purple-50 to-purple-100 border-purple-200';
      case 'ultimate':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getButtonColor = (planId) => {
    switch (planId) {
      case 'starter':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'pro':
        return 'bg-purple-600 hover:bg-purple-700';
      case 'ultimate':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Purchase Credits</h1>
          <p className="text-gray-600 text-lg">
            Current Balance: <span className="font-bold text-blue-600">{user?.credits || 0} credits</span>
          </p>
          {canceled && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 max-w-md mx-auto">
              Payment was canceled. No charges were made.
            </div>
          )}
        </div>

      
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br ${getPlanColor(plan.id)} border-2 rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-4 ring-purple-400' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    BEST VALUE
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.id)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">{plan.priceFormatted}</span>
                </div>
                <div className="text-3xl font-bold text-gray-700 mb-2">
                  {plan.credits.toLocaleString()}
                  <span className="text-lg font-normal text-gray-600"> credits</span>
                </div>
                <p className="text-sm text-gray-500">
                  ${(plan.price / plan.credits / 100).toFixed(4)} per credit
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Instant credit delivery</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Never expires</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Use anytime</span>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Secure payment via Stripe</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(plan.id)}
                disabled={processingPlan === plan.id}
                className={`w-full ${getButtonColor(plan.id)} text-white py-3 px-6 rounded-lg font-semibold focus:ring-4 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {processingPlan === plan.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Purchase Now'
                )}
              </button>
            </div>
          ))}
        </div>

      
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💳 Secure Payment</h3>
                <p className="text-gray-600 text-sm">
                  All payments are processed securely through Stripe. We never store your card details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">⚡ Instant Delivery</h3>
                <p className="text-gray-600 text-sm">
                  Credits are added to your account immediately after successful payment.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">♾️ No Expiration</h3>
                <p className="text-gray-600 text-sm">
                  Your credits never expire. Use them whenever you want.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🔄 Refund Policy</h3>
                <p className="text-gray-600 text-sm">
                  Contact support within 7 days for unused credits refund.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-6 py-3">
            <p className="text-sm text-blue-800">
              <strong>Test Mode:</strong> Use test card 4242 4242 4242 4242 with any future date and CVC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCredits;

