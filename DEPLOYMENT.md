# Deployment Guide for TrueGradient

This guide will help you deploy your TrueGradient application with the backend on Render and frontend on Vercel.

## Prerequisites

- MongoDB Atlas account (for database)
- Render account (for backend)
- Vercel account (for frontend)
- GitHub repository with your code

## Backend Deployment on Render

### 1. Prepare Your Backend

1. **Set up MongoDB Atlas:**
   - Create a new cluster on MongoDB Atlas
   - Create a database user
   - Get your connection string
   - Whitelist all IP addresses (0.0.0.0/0) for Render

2. **Environment Variables:**
   - Copy `backend/env.example` to `backend/.env`
   - Fill in your MongoDB connection string
   - Generate JWT secrets (use a secure random string generator)
   - Set your frontend URL (you'll update this after deploying frontend)

### 2. Deploy to Render

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory

2. **Configure Service:**
   - **Name:** `truegradient-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for production)

3. **Set Environment Variables in Render:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_REFRESH_SECRET=your_secure_refresh_secret_here
   NODE_ENV=production
   FRONTEND_ORIGIN=https://your-frontend-domain.vercel.app
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://truegradient-backend.onrender.com`)

## Frontend Deployment on Vercel

### 1. Prepare Your Frontend

1. **Update API Configuration:**
   - Copy `frontend/env.example` to `frontend/.env`
   - Update `VITE_API_URL` with your Render backend URL
   - Example: `VITE_API_URL=https://truegradient-backend.onrender.com/api`

### 2. Deploy to Vercel

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set the root directory to `frontend`

2. **Configure Build Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Set Environment Variables in Vercel:**
   ```
   # Backend API (your Render backend)
   VITE_API_URL=https://truegradient-backend.onrender.com/api
   
   # AI Service (Gemini API)
   VITE_AI_API_KEY=your_gemini_api_key_here
   VITE_AI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
   VITE_AI_MODEL=gemini-pro
   
   # Environment
   VITE_NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your frontend URL (e.g., `https://truegradient-frontend.vercel.app`)

## Post-Deployment Configuration

### 1. Update Backend CORS

After deploying the frontend, update your backend environment variables in Render:

1. Go to your Render service dashboard
2. Navigate to "Environment" tab
3. Update `FRONTEND_ORIGIN` to your Vercel frontend URL
4. Redeploy the service

### 2. Test the Application

1. **Health Check:**
   - Visit `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"status":"OK","timestamp":"...","uptime":...}`

2. **Frontend:**
   - Visit your Vercel URL
   - Test user registration/login
   - Test chat functionality

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure `FRONTEND_ORIGIN` in backend matches your Vercel URL exactly
   - Check that the backend is redeployed after updating environment variables

2. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Ensure IP whitelist includes Render's IP ranges
   - Check database user permissions

3. **Build Failures:**
   - Check build logs in Render/Vercel dashboards
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

4. **Environment Variables:**
   - Double-check all environment variables are set correctly
   - Ensure no typos in variable names
   - Restart services after updating environment variables

### Monitoring

- **Render:** Check service logs in the Render dashboard
- **Vercel:** Monitor function logs in Vercel dashboard
- **MongoDB:** Monitor connection and query performance in Atlas

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **CORS:**
   - Only allow your specific frontend domain
   - Avoid using wildcard origins in production

3. **Rate Limiting:**
   - Configure appropriate rate limits
   - Monitor for abuse

## Scaling Considerations

- **Render:** Upgrade to paid plan for better performance and reliability
- **Vercel:** Consider Pro plan for advanced features
- **MongoDB:** Monitor usage and upgrade cluster as needed

## Support

If you encounter issues:
1. Check the logs in both Render and Vercel dashboards
2. Verify all environment variables are correctly set
3. Test API endpoints directly using tools like Postman
4. Check MongoDB Atlas for connection issues
