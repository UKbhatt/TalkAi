import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle, Loader } from 'lucide-react';
import apiService from '../services/api';
import { updateCredits } from '../store/authSlice';

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    try {
      const response = await apiService.request(`/payment/verify-session/${sessionId}`);
      setPayment(response.payment);
      
      if (response.user && response.user.credits !== undefined) {
        dispatch(updateCredits(response.user.credits));
        console.log(`Credits updated! New balance: ${response.user.credits}`);
      }

      try {
        const userResponse = await apiService.getCurrentUser();
        if (userResponse.user && userResponse.user.credits !== undefined) {
          dispatch(updateCredits(userResponse.user.credits));
        }
      } catch (err) {
        console.warn('Could not fetch updated user data:', err);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError('Failed to verify payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">Your credits have been added to your account</p>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <div className="text-sm text-gray-600 mb-2">Credits Purchased</div>
          <div className="text-4xl font-bold text-blue-600 mb-4">
            +{payment?.credits.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {payment?.plan.charAt(0).toUpperCase() + payment?.plan.slice(1)} Pack - ${payment?.amount}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Transaction Date</span>
            <span className="text-gray-900 font-medium">
              {new Date(payment?.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Method</span>
            <span className="text-gray-900 font-medium">Credit Card</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            Start Chatting
          </button>
          <button
            onClick={() => navigate('/purchase-credits')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            Buy More Credits
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          A receipt has been sent to your email
        </p>
      </div>
    </div>
  );
};

export default PurchaseSuccess;

