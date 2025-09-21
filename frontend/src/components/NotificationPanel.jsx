import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Check, Bell } from 'lucide-react';
import { toggleNotificationPanel, markNotificationRead } from '../store/uiSlice';

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.ui);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white border-l border-gray-200 shadow-2xl z-30 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
        </div>
        <button
          onClick={() => dispatch(toggleNotificationPanel())}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h4>
            <p className="text-gray-500 text-sm">You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  notification.read
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-medium text-gray-900 leading-relaxed">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => dispatch(markNotificationRead(notification.id))}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;