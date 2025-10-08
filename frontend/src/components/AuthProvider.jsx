import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getCurrentUser, setLoading } from '../store/authSlice';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log('🔐 AuthProvider: Fetching current user...');
          await dispatch(getCurrentUser()).unwrap();
          console.log('🔐 AuthProvider: User data loaded successfully');
        } catch (error) {
          console.error('Failed to get current user:', error);
          
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } else {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  return children;
};

export default AuthProvider;