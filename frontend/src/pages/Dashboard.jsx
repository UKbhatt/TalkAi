import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const { sidebarCollapsed } = useSelector((state) => state.ui);

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header - Full Width */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Mobile Sidebar Overlay */}
        {!sidebarCollapsed && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" />
        )}

        {/* Sidebar */}
        <div className={`${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        } fixed lg:relative z-30 lg:z-0 ${sidebarCollapsed ? 'lg:w-20' : 'w-80 lg:w-80'} h-full transition-all duration-300 ease-in-out ${!sidebarCollapsed ? 'border-r border-gray-200' : ''}`}>
          <Sidebar />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <ChatArea />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;