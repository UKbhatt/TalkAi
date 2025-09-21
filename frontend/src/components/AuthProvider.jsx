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
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          console.error('Failed to get current user:', error);
          // Token might be invalid, clear it
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