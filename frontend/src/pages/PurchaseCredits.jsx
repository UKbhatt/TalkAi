import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Check, Sparkles, ArrowLeft, Zap } from 'lucide-react';
import apiService from '../services/api';

const PurchaseCredits = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const [processing, setProcessing] = useState(false);
  const canceled = searchParams.get('canceled');

  const plan = {
    id: 'credits_500',
    name: 'Credits Pack',
    credits: 500,
    price: 499,
    priceFormatted: '₹499',
    description: 'Get 500 credits to power your conversations'
  };

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      console.log('🛒 Starting purchase process...');
      
      const response = await apiService.request('/pay/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id })
      });

      console.log('🛒 Checkout response received');
      console.log('🛒 Redirecting to Stripe...');
      
      window.location.href = response.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Purchase Credits
          </h1>
          <p className="text-lg text-gray-600">
            Get more credits to continue your AI conversations
          </p>
          
          <div className="mt-6 inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-600">Current Balance:</span>
            <span className="font-bold text-gray-900 text-lg">
              {user?.credits !== undefined ? user.credits.toLocaleString() : '0'} credits
            </span>
          </div>
        </div>

        {canceled && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-yellow-800">
              Payment was canceled. You can try again whenever you're ready.
            </p>
          </div>
        )}

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-blue-200 transform transition-all hover:scale-105 hover:shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-center text-white">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-blue-100 text-sm">{plan.description}</p>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {plan.priceFormatted}
                </div>
                <div className="text-gray-500">One-time payment</div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">You'll receive</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {plan.credits.toLocaleString()} credits
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">500 AI conversation credits</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">Instant credit delivery</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">Secure payment via Stripe</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">No expiration or hidden fees</span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={processing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Purchase Now</span>
                  </div>
                )}
              </button>

              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secured by Stripe</span>
                </div>
              </div>
            </div>
          </div>
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
