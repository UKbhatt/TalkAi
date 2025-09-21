import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  notifications: [
    {
      id: 1,
      type: 'welcome',
      message: "Welcome to AI Chat. You have 1,250 credits to start with.",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      type: 'feature',
      message: "New conversation export feature is now available.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: false,
    }
  ],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleNotificationPanel: (state, action) => {
      if (typeof action.payload === 'boolean') {
        state.notificationPanelOpen = action.payload;
      } else {
        state.notificationPanelOpen = !state.notificationPanelOpen;
      }
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
  },
});

export const { 
  toggleSidebar, 
  toggleNotificationPanel, 
  addNotification, 
  markNotificationRead,
  markAllNotificationsRead
} = uiSlice.actions;
export default uiSlice.reducer;