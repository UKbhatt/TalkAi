# Stripe Payment Integration - Setup Guide

## ✅ What's Implemented

Your TrueGradient app now has a complete Stripe payment system with **3 credit packages**:

### Credit Packages:
1. **Starter Pack** - 500 credits for $4.99
2. **Pro Pack** - 2000 credits for $14.99 (Best Value!)
3. **Ultimate Pack** - 5000 credits for $29.99

## 🎯 Features

✅ Secure payment processing with Stripe
✅ Stripe Checkout integration
✅ Automatic credit delivery
✅ Payment history tracking
✅ Test mode for development
✅ Beautiful pricing page
✅ Success page with confirmation
✅ "Purchase Credits" in profile dropdown

## 📦 Files Created/Modified

### Backend Files:
- `backend/models/Payment.js` - Payment transaction model
- `backend/models/User.js` - Added Stripe customer ID & purchase tracking
- `backend/routes/payment.js` - All payment routes
- `backend/server.js` - Added payment routes
- `backend/package.json` - Added Stripe dependency
- `backend/env.example` - Added Stripe environment variables

### Frontend Files:
- `frontend/src/pages/PurchaseCredits.jsx` - Pricing page
- `frontend/src/pages/PurchaseSuccess.jsx` - Success confirmation page
- `frontend/src/components/Header.jsx` - Added "Purchase Credits" option
- `frontend/src/App.jsx` - Added new routes

## 🚀 Setup Instructions

### Step 1: Install Stripe Package (Backend)

```bash
cd backend
npm install stripe
```

### Step 2: Get Stripe Test API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 3: Set Backend Environment Variables

Add these to your `backend/.env`:

```env
# Stripe Test Mode Keys
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# These can be left as placeholders (not used in current implementation)
STRIPE_STARTER_PRICE_ID=price_starter
STRIPE_PRO_PRICE_ID=price_pro
STRIPE_ULTIMATE_PRICE_ID=price_ultimate
```

### Step 4: Test Locally

#### Start Backend:
```bash
cd backend
npm start
```

#### Start Frontend:
```bash
cd frontend
npm run dev
```

#### Test the Flow:
1. Login to your app
2. Click profile icon → "Purchase Credits"
3. Select a plan and click "Purchase Now"
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
6. Complete payment
7. You'll be redirected back to success page
8. Credits will be added automatically!

## 💳 Stripe Test Cards

### Success Cards:
- `4242 4242 4242 4242` - Standard success
- `4000 0025 0000 3155` - 3D Secure authentication required
- `5555 5555 5555 4444` - Mastercard success

### Decline Cards:
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 0069` - Expired card

### All Test Cards:
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## 📡 API Endpoints

### GET `/api/payment/plans`
Get available credit plans
**Response:**
```json
{
  "plans": [
    {
      "id": "starter",
      "name": "Starter Pack",
      "credits": 500,
      "price": 499,
      "priceFormatted": "$4.99",
      "description": "500 credits for casual users"
    },
    ...
  ]
}
```

### POST `/api/payment/create-checkout-session`
Create Stripe checkout session
**Body:**
```json
{
  "planId": "pro"
}
```
**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### GET `/api/payment/verify-session/:sessionId`
Verify payment and add credits
**Response:**
```json
{
  "message": "Payment verified and credits added",
  "payment": {
    "id": "...",
    "credits": 2000,
    "amount": 14.99,
    "plan": "pro"
  },
  "user": {
    "credits": 3250,
    "totalPurchased": 2000
  }
}
```

### GET `/api/payment/history`
Get user's payment history
**Query Params:** `page`, `limit`
**Response:**
```json
{
  "payments": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

## 🔄 Payment Flow

```
User clicks "Purchase Credits"
  ↓
Selects a plan
  ↓
Frontend: POST /api/payment/create-checkout-session
  ↓
Backend creates Stripe Checkout Session
  ↓
User redirected to Stripe Checkout
  ↓
User enters payment details (test card)
  ↓
Stripe processes payment
  ↓
User redirected to /purchase-success?session_id=xxx
  ↓
Frontend: GET /api/payment/verify-session/:sessionId
  ↓
Backend verifies payment & adds credits
  ↓
Success page shows confirmation
  ↓
User's credit balance updated
```

## 💾 Database Collections

### Payments Collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  stripePaymentIntentId: "pi_xxx",
  stripeSessionId: "cs_test_xxx",
  amount: 14.99,
  currency: "USD",
  credits: 2000,
  plan: "pro",
  status: "completed",
  metadata: {
    customerEmail: "user@example.com",
    customerName: "John Doe",
    paymentMethod: "card"
  },
  createdAt: Date,
  updatedAt: Date
}
```

### User Model Updates:
```javascript
{
  // ... existing fields
  stripeCustomerId: "cus_xxx",
  totalPurchased: 2000,
  credits: 3250
}
```

## 🎨 UI Components

### Purchase Credits Page:
- Beautiful pricing cards
- 3 plan options
- "Best Value" badge on Pro plan
- Feature list for each plan
- Color-coded cards
- Loading states
- Test mode notice

### Profile Dropdown:
- "Purchase Credits" option with icon
- Navigates to pricing page
- Closes dropdown on click

### Success Page:
- Green checkmark confirmation
- Credits purchased display
- Transaction details
- "Start Chatting" button
- "Buy More Credits" button

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] Pricing page loads correctly
- [ ] All 3 plans display properly
- [ ] Click "Purchase Now" redirects to Stripe
- [ ] Stripe Checkout loads
- [ ] Test card payment succeeds
- [ ] Redirected to success page
- [ ] Credits added to account
- [ ] Credit balance updates in header
- [ ] Payment saved in database
- [ ] Can purchase again
- [ ] Profile dropdown shows "Purchase Credits"

## 🚨 Common Issues & Solutions

### Issue: Stripe checkout not loading
**Solution:** 
- Check `STRIPE_SECRET_KEY` is set correctly
- Verify it starts with `sk_test_`
- Check backend logs for errors

### Issue: Credits not added after payment
**Solution:**
- Check `/api/payment/verify-session` endpoint
- Verify MongoDB connection
- Check backend logs
- Ensure session ID is in URL

### Issue: "Invalid API key" error
**Solution:**
- Copy fresh keys from Stripe dashboard
- Ensure no extra spaces in .env file
- Restart backend after updating .env

### Issue: Payment succeeds but redirect fails
**Solution:**
- Check `FRONTEND_ORIGIN` in backend .env
- Verify it matches your frontend URL
- Check Stripe success URL configuration

## 🌐 Production Deployment

### Backend (Render):
Add these environment variables:
```
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_ORIGIN=https://your-app.vercel.app
```

### Frontend (Vercel):
No Stripe-specific env vars needed for frontend!
All payment processing is handled by backend.

### Switch to Live Mode:
1. Get live API keys from Stripe dashboard
2. Replace `sk_test_` with `sk_live_` in backend
3. Test with real card
4. Monitor Stripe dashboard

## 📊 Stripe Dashboard

View in Test Mode:
- https://dashboard.stripe.com/test/payments
- https://dashboard.stripe.com/test/customers
- https://dashboard.stripe.com/test/logs

See all transactions, customers, and logs in real-time!

## 💰 Pricing Strategy

Current setup:
- **Starter**: $4.99 for 500 credits ($0.00998 per credit)
- **Pro**: $14.99 for 2000 credits ($0.007495 per credit) - 25% discount!
- **Ultimate**: $29.99 for 5000 credits ($0.005998 per credit) - 40% discount!

To change prices, edit `backend/routes/payment.js`:
```javascript
const CREDIT_PLANS = {
  starter: {
    credits: 500,
    price: 499, // in cents
    ...
  }
}
```

## 🎯 Next Steps

1. ✅ Test locally with test cards
2. ✅ Deploy to production
3. ✅ Switch to live Stripe keys
4. Add webhook handling for better reliability
5. Add refund functionality
6. Add payment history page
7. Email receipts to users
8. Add promo codes/discounts
9. Analytics & reporting

## 📞 Support

- Stripe Test Mode: https://stripe.com/docs/testing
- Stripe API Docs: https://stripe.com/docs/api
- Your Implementation: All code in `backend/routes/payment.js` and `frontend/src/pages/Purchase*.jsx`

## 🎉 You're All Set!

Your Stripe integration is complete and ready to accept test payments! 

Test the flow and you'll see:
1. Beautiful pricing page
2. Secure Stripe checkout
3. Automatic credit delivery
4. Professional success page
5. Updated credit balance

Happy selling! 💰🚀
