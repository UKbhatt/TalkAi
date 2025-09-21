import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import chatSlice from './chatSlice';
import uiSlice from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    ui: uiSlice,
  },
});