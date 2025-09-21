import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, ChevronDown, User } from 'lucide-react';
import { toggleNotificationPanel, markAllNotificationsRead } from '../store/uiSlice';
import { logout } from '../store/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notificationPanelOpen, notifications } = useSelector((state) => state.ui);
  
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  return (
            <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between relative z-10">
      <div className="flex items-center space-x-4">
        <h1 className="font-bold text-gray-900" style={{ fontSize: '18px' }}>AI Chat</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Credits */}
        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-100">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
          <span className="font-semibold" style={{ fontSize: '12px' }}>
            {user?.credits !== undefined && user?.credits !== null ? user.credits.toLocaleString() : '1,250'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => dispatch(toggleNotificationPanel())}
                    className={`p-1.5 rounded-lg transition-all duration-200 relative ${
              notificationPanelOpen 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount}
              </div>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {notificationPanelOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => dispatch(toggleNotificationPanel(false))}
              />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900" style={{ fontSize: '12px' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                        <div className="max-h-48 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-3 py-2 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          notification.type === 'welcome' ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.type === 'welcome' ? 'Welcome!' : 'Feature Update'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.type === 'welcome' ? '6m ago' : '2h ago'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 truncate max-w-32">
                {user?.username || user?.email || 'akshaykashyap7879@gmail.com'}
              </p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {userDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {user?.username || user?.email || 'akshaykashyap7879@gmail.com'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Free Plan</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;